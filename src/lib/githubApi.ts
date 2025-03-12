
import { GitHubSettings, PullRequest } from "./types";

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
      headers["Authorization"] = `token ${token}`;
    }
    
    // Instead of combining all users in one query, we'll fetch for each user individually
    // and then combine the results
    const allPullRequests: PullRequest[] = [];
    
    // Fetch PRs for each user separately
    for (const user of users) {
      const query = `org:${organization} author:${user} is:pr is:open`;
      const url = `${BASE_URL}/search/issues?q=${encodeURIComponent(query)}&per_page=100`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        console.error(`GitHub API error for user ${user}:`, response.status, response.statusText);
        continue; // Skip this user but continue with others
      }
      
      const data = await response.json();
      
      // Process pull requests for this user
      const userPullRequests = await Promise.all(
        data.items.map(async (item: any) => {
          // Extract repository info from repository_url
          const repoUrl = item.repository_url;
          const repoResponse = await fetch(repoUrl, { headers });
          
          if (!repoResponse.ok) {
            console.error(`Failed to fetch repo data for PR #${item.number}:`, repoResponse.status);
            return null;
          }
          
          const repoData = await repoResponse.json();
          
          return {
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
            labels: item.labels.map((label: any) => ({
              id: label.id,
              name: label.name,
              color: label.color,
            })),
          };
        })
      );
      
      // Filter out any null values (from failed requests) and add to overall results
      allPullRequests.push(...userPullRequests.filter(Boolean));
    }
    
    return allPullRequests;
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    throw error;
  }
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
