
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  draft: boolean;
  user: GitHubUser;
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  comments_count?: number;
  comments_url?: string;
  last_read_at?: string | null;
  has_new_activity?: boolean;
  reviews?: Review[];
  review_status?: ReviewStatus;
  reviewers?: { [key: string]: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" };
}

export interface Review {
  id: number;
  user: GitHubUser;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING";
  submitted_at: string;
  html_url: string;
}

export type ReviewStatus = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "NONE";

export interface RepositoryGroup {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  pullRequests: PullRequest[];
}

export interface AuthorGroup {
  user: GitHubUser;
  pullRequests: PullRequest[];
}

export interface GitHubSettings {
  organization: string;
  users: string[];
  token: string;
  currentUser?: string; // Added current user field
}

export type GroupingOption = "repository" | "author";
export type SortingOption = "updated" | "created";

export interface GitHubState {
  pullRequests: PullRequest[];
  repositoryGroups: RepositoryGroup[];
  authorGroups: AuthorGroup[];
  filteredUsers: string[];
  loading: boolean;
  error: string | null;
  grouping: GroupingOption;
  sorting: SortingOption;
  settings: GitHubSettings;
  showDrafts: boolean; // Added this property
}

export interface ReadStatus {
  prId: number;
  lastReadAt: string;
  commentsReadCount: number;
}
