
import { PullRequest, ReadStatus } from "./types";

const READ_STATUS_KEY = "github-inbox-read-status";

export function getReadStatusFromStorage(): Record<number, ReadStatus> {
  try {
    const stored = localStorage.getItem(READ_STATUS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading PR read status from storage:", error);
  }
  return {};
}

export function saveReadStatusToStorage(readStatus: Record<number, ReadStatus>): void {
  try {
    localStorage.setItem(READ_STATUS_KEY, JSON.stringify(readStatus));
  } catch (error) {
    console.error("Error saving PR read status to storage:", error);
  }
}

export function markPullRequestAsRead(
  pr: PullRequest,
  readStatuses: Record<number, ReadStatus>,
  commentsCount: number = pr.comments_count || 0
): Record<number, ReadStatus> {
  const updatedReadStatuses = { ...readStatuses };
  
  updatedReadStatuses[pr.id] = {
    prId: pr.id,
    lastReadAt: new Date().toISOString(),
    commentsReadCount: commentsCount
  };
  
  saveReadStatusToStorage(updatedReadStatuses);
  return updatedReadStatuses;
}

export function togglePullRequestReadStatus(
  pr: PullRequest,
  readStatuses: Record<number, ReadStatus>
): Record<number, ReadStatus> {
  const updatedReadStatuses = { ...readStatuses };
  
  // If PR is currently marked as read (no new activity), mark it as unread
  if (!hasNewActivity(pr, readStatuses[pr.id])) {
    // Delete the read status to mark it as unread
    delete updatedReadStatuses[pr.id];
  } else {
    // Otherwise mark it as read
    updatedReadStatuses[pr.id] = {
      prId: pr.id,
      lastReadAt: new Date().toISOString(),
      commentsReadCount: pr.comments_count || 0
    };
  }
  
  saveReadStatusToStorage(updatedReadStatuses);
  return updatedReadStatuses;
}

export function hasNewActivity(
  pr: PullRequest, 
  readStatus: ReadStatus | undefined,
  currentUser?: string
): boolean {
  // If never read before, it has new activity
  if (!readStatus) {
    // But check if the last activity was my review
    if (currentUser && isLastActivityMyReview(pr, currentUser)) {
      // Auto-mark as read by creating a read status
      return false;
    }
    return true;
  }
  
  // Compare last update with last read time
  const lastReadAt = new Date(readStatus.lastReadAt);
  const lastUpdatedAt = new Date(pr.updated_at);
  
  // If PR was updated after last read
  if (lastUpdatedAt > lastReadAt) {
    // Check if the update is my own review
    if (currentUser && isLastActivityMyReview(pr, currentUser)) {
      return false;
    }
    return true;
  }
  
  // If there are new comments since last read
  if (pr.comments_count && readStatus.commentsReadCount < pr.comments_count) {
    return true;
  }
  
  return false;
}

// New function to check if the last activity was the current user's review
export function isLastActivityMyReview(pr: PullRequest, currentUser: string): boolean {
  if (!pr.reviews || pr.reviews.length === 0) {
    return false;
  }
  
  // Find the most recent review
  const sortedReviews = [...pr.reviews].sort((a, b) => 
    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );
  
  const latestReview = sortedReviews[0];
  
  // Check if the latest review is from the current user
  if (latestReview.user.login.toLowerCase() !== currentUser.toLowerCase()) {
    return false;
  }
  
  // Check if this review is the most recent activity on the PR
  const reviewDate = new Date(latestReview.submitted_at);
  const updateDate = new Date(pr.updated_at);
  
  // Allow a small buffer (10 seconds) to account for slight timing differences
  const buffer = 10 * 1000; // 10 seconds in milliseconds
  
  // If the review time and update time are within the buffer of each other,
  // consider the review to be the last activity
  return Math.abs(reviewDate.getTime() - updateDate.getTime()) <= buffer;
}

export function applyReadStatus(
  pullRequests: PullRequest[],
  readStatuses: Record<number, ReadStatus>,
  currentUser?: string
): PullRequest[] {
  return pullRequests.map(pr => {
    const readStatus = readStatuses[pr.id];
    
    // Auto-mark PRs as read if last activity was my review
    const shouldAutoMarkAsRead = currentUser && 
                                !readStatus && 
                                isLastActivityMyReview(pr, currentUser);
    
    if (shouldAutoMarkAsRead) {
      // Create a new read status for this PR
      readStatuses[pr.id] = {
        prId: pr.id,
        lastReadAt: new Date().toISOString(),
        commentsReadCount: pr.comments_count || 0
      };
      
      // Save the updated read statuses
      saveReadStatusToStorage(readStatuses);
    }
    
    return {
      ...pr,
      last_read_at: readStatus?.lastReadAt || (shouldAutoMarkAsRead ? new Date().toISOString() : null),
      has_new_activity: hasNewActivity(pr, readStatus, currentUser)
    };
  });
}
