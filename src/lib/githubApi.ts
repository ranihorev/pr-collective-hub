import { GitHubSettings, PullRequest, Review, ReviewStatus } from "./types";

const BASE_URL = "https://api.github.com";

export async function fetchPullRequests(settings: GitHubSettings): Promise<PullRequest[]> {
  const { organization, users, token } = settings;
  
  if (!organization || users.length === 0) {
    return [];
  }
  
  try {
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const authorQuery = users.map(user => `author:${user}`).join(" ");
    const query = `org:${organization} is:pr is:open ${authorQuery}`;
    const url = `${BASE_URL}/search/issues?q=${encodeURIComponent(query)}&per_page=100`;
    
    console.log(`Fetching PRs with URL: ${url}`);
    
    const response = await fetch(url, { headers });
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`GitHub API error:`, response.status, response.statusText);
      console.error(`Response body:`, responseText);
      throw new Error(`GitHub API returned ${response.status}: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    
    if (!data.items || !Array.isArray(data.items)) {
      console.error(`Invalid response format:`, data);
      throw new Error("Invalid response format from GitHub API");
    }
    
    console.log(`Found ${data.items.length} PRs`);
    
    const pullRequests = await Promise.all(
      data.items.map(async (item: any) => {
        try {
          const repoUrl = item.repository_url;
          
          const repoResponse = await fetch(repoUrl, { headers });
          
          if (!repoResponse.ok) {
            console.error(`Failed to fetch repo data for PR #${item.number}:`, repoResponse.status);
            return null;
          }
          
          const repoData = await repoResponse.json();
          
          const pullRequest = {
            id: item.id,
            number: item.number,
            title: item.title,
            html_url: item.html_url,
            state: item.state,
            created_at: item.created_at,
            updated_at: item.updated_at,
            closed_at: item.closed_at,
            merged_at: item.pull_request?.merged_at || null,
            draft: item.draft || false,
            user: {
              login: item.user.login,
              id: item.user.id,
              avatar_url: item.user.avatar_url,
              html_url: item.user.html_url,
            },
            repository: {
              id: repoData.id,
              name: repoData.name,
              full_name: repoData.full_name,
              html_url: repoData.html_url,
              description: repoData.description,
            },
            labels: item.labels ? item.labels.map((label: any) => ({
              id: label.id,
              name: label.name,
              color: label.color,
            })) : [],
            comments_count: item.comments,
            comments_url: item.comments_url,
          };
          
          return await fetchReviewsForPullRequest(pullRequest, settings, headers);
        } catch (itemError) {
          console.error(`Error processing PR item:`, itemError);
          return null;
        }
      })
    );
    
    return pullRequests.filter(Boolean);
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    throw error;
  }
}

async function fetchReviewsForPullRequest(
  pullRequest: PullRequest, 
  settings: GitHubSettings,
  headers: Record<string, string>
): Promise<PullRequest> {
  try {
    const { organization } = settings;
    const { number } = pullRequest;
    const repoName = pullRequest.repository.name;
    
    const reviewsUrl = `${BASE_URL}/repos/${organization}/${repoName}/pulls/${number}/reviews`;
    const reviewsResponse = await fetch(reviewsUrl, { headers });
    
    if (!reviewsResponse.ok) {
      console.error(`Failed to fetch reviews for PR #${number}:`, reviewsResponse.status);
      return pullRequest;
    }
    
    const reviewsData = await reviewsResponse.json();
    
    if (!Array.isArray(reviewsData)) {
      console.error(`Invalid reviews data format for PR #${number}:`, reviewsData);
      return pullRequest;
    }
    
    const reviews: Review[] = reviewsData.map((review: any) => ({
      id: review.id,
      user: {
        login: review.user.login,
        id: review.user.id,
        avatar_url: review.user.avatar_url,
        html_url: review.user.html_url,
      },
      state: review.state,
      submitted_at: review.submitted_at,
      html_url: review.html_url,
    }));
    
    const { status, reviewers } = determineReviewStatusWithReviewers(reviews);
    
    return {
      ...pullRequest,
      reviews,
      review_status: status,
      reviewers,
    };
  } catch (error) {
    console.error(`Error fetching reviews for PR #${pullRequest.number}:`, error);
    return pullRequest;
  }
}

function determineReviewStatusWithReviewers(reviews: Review[]): { 
  status: ReviewStatus; 
  reviewers: { [key: string]: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" } 
} {
  if (reviews.length === 0) {
    return { status: "NONE", reviewers: {} };
  }
  
  const userLatestReviews = new Map<number, Review>();
  const reviewers: { [key: string]: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" } = {};
  
  reviews.forEach(review => {
    const userId = review.user.id;
    const existingReview = userLatestReviews.get(userId);
    
    if (!existingReview || new Date(review.submitted_at) > new Date(existingReview.submitted_at)) {
      userLatestReviews.set(userId, review);
      
      if (review.state === "APPROVED" || review.state === "CHANGES_REQUESTED" || review.state === "COMMENTED") {
        reviewers[review.user.login] = review.state;
      }
    }
  });
  
  const latestReviews = Array.from(userLatestReviews.values());
  
  if (latestReviews.some(review => review.state === "CHANGES_REQUESTED")) {
    return { status: "CHANGES_REQUESTED", reviewers };
  }
  
  if (latestReviews.some(review => review.state === "APPROVED")) {
    return { status: "APPROVED", reviewers };
  }
  
  if (latestReviews.some(review => review.state === "COMMENTED")) {
    return { status: "COMMENTED", reviewers };
  }
  
  return { status: "NONE", reviewers };
}

function determineReviewStatus(reviews: Review[]): ReviewStatus {
  return determineReviewStatusWithReviewers(reviews).status;
}

export function groupPullRequestsByRepository(pullRequests: PullRequest[]) {
  const repositories: Record<number, PullRequest[]> = {};
  
  pullRequests.forEach(pr => {
    const repoId = pr.repository.id;
    if (!repositories[repoId]) {
      repositories[repoId] = [];
    }
    repositories[repoId].push(pr);
  });
  
  return Object.values(repositories).map(prs => ({
    id: prs[0].repository.id,
    name: prs[0].repository.name,
    full_name: prs[0].repository.full_name,
    html_url: prs[0].repository.html_url,
    description: prs[0].repository.description,
    pullRequests: prs,
  }));
}

export function groupPullRequestsByAuthor(pullRequests: PullRequest[]) {
  const authors: Record<string, PullRequest[]> = {};
  
  pullRequests.forEach(pr => {
    const authorId = pr.user.login;
    if (!authors[authorId]) {
      authors[authorId] = [];
    }
    authors[authorId].push(pr);
  });
  
  return Object.entries(authors).map(([_, prs]) => ({
    user: prs[0].user,
    pullRequests: prs,
  }));
}

export function sortPullRequests(pullRequests: PullRequest[], sortBy: "updated" | "created" = "updated") {
  return [...pullRequests].sort((a, b) => {
    const dateA = new Date(sortBy === "updated" ? a.updated_at : a.created_at);
    const dateB = new Date(sortBy === "updated" ? b.updated_at : b.created_at);
    return dateB.getTime() - dateA.getTime();
  });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
