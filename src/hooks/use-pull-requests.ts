
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchPullRequests, 
  groupPullRequestsByRepository, 
  groupPullRequestsByAuthor,
  sortPullRequests
} from '@/lib/githubApi';
import { 
  GitHubSettings, 
  PullRequest, 
  RepositoryGroup,
  AuthorGroup,
  SortingOption,
  ReadStatus
} from '@/lib/types';
import { 
  getReadStatusFromStorage,
  applyReadStatus,
  markPullRequestAsRead,
  togglePullRequestReadStatus
} from '@/lib/readStatusService';

export function usePullRequests(
  settings: GitHubSettings,
  sorting: SortingOption,
  filteredUsers: string[],
  showUnreadOnly: boolean,
  showDrafts: boolean = false
) {
  const { toast } = useToast();
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [repositoryGroups, setRepositoryGroups] = useState<RepositoryGroup[]>([]);
  const [authorGroups, setAuthorGroups] = useState<AuthorGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readStatuses, setReadStatuses] = useState<Record<number, ReadStatus>>({});
  
  // Load read statuses from localStorage on mount
  useEffect(() => {
    setReadStatuses(getReadStatusFromStorage());
  }, []);
  
  // Filtered pull requests based on current filters
  const filteredPullRequests = pullRequests.filter(pr => 
    filteredUsers.includes(pr.user.login) && 
    (!showUnreadOnly || pr.has_new_activity) &&
    (showDrafts || !pr.draft)
  );
  
  // Filtered repository and author groups
  const filteredRepositoryGroups = repositoryGroups.map(group => ({
    ...group,
    pullRequests: group.pullRequests.filter(pr => {
      const userMatch = filteredUsers.includes(pr.user.login);
      const unreadMatch = !showUnreadOnly || pr.has_new_activity;
      const draftMatch = showDrafts || !pr.draft;
      return userMatch && unreadMatch && draftMatch;
    }),
  })).filter(group => group.pullRequests.length > 0);
  
  const filteredAuthorGroups = authorGroups
    .filter(group => filteredUsers.includes(group.user.login))
    .map(group => ({
      ...group,
      pullRequests: group.pullRequests.filter(pr => 
        (!showUnreadOnly || pr.has_new_activity) &&
        (showDrafts || !pr.draft)
      )
    }))
    .filter(group => group.pullRequests.length > 0);
  
  // Get unique users from pull requests
  const uniqueUsers = Array.from(
    new Map(
      pullRequests.map(pr => [pr.user.login, pr.user])
    ).values()
  );
  
  // Count of unread pull requests
  const unreadCount = filteredPullRequests.filter(pr => pr.has_new_activity).length;
  
  const fetchData = useCallback(async () => {
    if (!settings.organization || settings.users.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let prs = await fetchPullRequests(settings);
      
      // Apply read status to pull requests
      prs = applyReadStatus(prs, readStatuses);
      setPullRequests(prs);
      
      const repoGroups = groupPullRequestsByRepository(
        sortPullRequests(prs, sorting)
      );
      setRepositoryGroups(repoGroups);
      
      const userGroups = groupPullRequestsByAuthor(
        sortPullRequests(prs, sorting)
      );
      setAuthorGroups(userGroups);
      
      // Removed the toast notifications about PR count
      
      if (prs.length === 0) {
        toast({
          title: "No pull requests found",
          description: "Try adding more users or check your organization name."
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: "Failed to fetch pull requests",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [settings, sorting, readStatuses, toast]);
  
  // Mark a single PR as read or unread (toggle)
  const handleMarkAsRead = useCallback((pr: PullRequest) => {
    // Store the previous state for potential undo operation
    const previousState = { ...readStatuses };
    const wasRead = !hasNewActivity(pr, readStatuses[pr.id]);
    
    const updatedReadStatuses = togglePullRequestReadStatus(pr, readStatuses);
    setReadStatuses(updatedReadStatuses);
    
    // Update the PullRequest in state
    const updatedPullRequests = pullRequests.map(p => {
      if (p.id === pr.id) {
        const isNowRead = !hasNewActivity(p, updatedReadStatuses[p.id]);
        return {
          ...p,
          last_read_at: isNowRead ? new Date().toISOString() : null,
          has_new_activity: !isNowRead
        };
      }
      return p;
    });
    
    setPullRequests(updatedPullRequests);
    
    // Update repository groups
    const updatedRepoGroups = groupPullRequestsByRepository(
      sortPullRequests(updatedPullRequests, sorting)
    );
    setRepositoryGroups(updatedRepoGroups);
    
    // Update author groups
    const updatedAuthorGroups = groupPullRequestsByAuthor(
      sortPullRequests(updatedPullRequests, sorting)
    );
    setAuthorGroups(updatedAuthorGroups);
    
    // Display toast with undo button
    const { dismiss } = toast({
      title: pr.has_new_activity ? "Marked as read" : "Marked as unread",
      description: `"${pr.title}" is now marked as ${pr.has_new_activity ? "read" : "unread"}`,
      action: (
        <button
          onClick={() => {
            // Restore previous state
            setReadStatuses(previousState);
            
            // Revert the PullRequest state
            const revertedPullRequests = pullRequests.map(p => {
              if (p.id === pr.id) {
                return {
                  ...p,
                  last_read_at: wasRead ? new Date().toISOString() : null,
                  has_new_activity: !wasRead
                };
              }
              return p;
            });
            
            setPullRequests(revertedPullRequests);
            
            // Update repository and author groups
            setRepositoryGroups(groupPullRequestsByRepository(
              sortPullRequests(revertedPullRequests, sorting)
            ));
            
            setAuthorGroups(groupPullRequestsByAuthor(
              sortPullRequests(revertedPullRequests, sorting)
            ));
            
            // Save reverted state to storage
            saveReadStatusToStorage(previousState);
            dismiss();
          }}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-8 px-3 py-2"
        >
          <span>Undo</span>
        </button>
      ),
    });
  }, [pullRequests, readStatuses, sorting, toast]);
  
  // Mark all filtered PRs as read
  const handleMarkAllAsRead = useCallback(() => {
    // Store previous state for potential undo
    const previousState = { ...readStatuses };
    
    let updatedReadStatuses = { ...readStatuses };
    
    // Mark all filtered PRs as read
    filteredPullRequests.forEach(pr => {
      updatedReadStatuses = markPullRequestAsRead(pr, updatedReadStatuses, pr.comments_count);
    });
    
    setReadStatuses(updatedReadStatuses);
    
    // Update the PullRequests in state
    const updatedPullRequests = pullRequests.map(p => {
      if (filteredUsers.includes(p.user.login)) {
        return {
          ...p,
          last_read_at: new Date().toISOString(),
          has_new_activity: false
        };
      }
      return p;
    });
    
    setPullRequests(updatedPullRequests);
    
    // Update repository groups and author groups
    const updatedRepoGroups = groupPullRequestsByRepository(
      sortPullRequests(updatedPullRequests, sorting)
    );
    setRepositoryGroups(updatedRepoGroups);
    
    const updatedAuthorGroups = groupPullRequestsByAuthor(
      sortPullRequests(updatedPullRequests, sorting)
    );
    setAuthorGroups(updatedAuthorGroups);
    
    // Display toast with undo button
    const { dismiss } = toast({
      title: "All marked as read",
      description: `Marked ${filteredPullRequests.length} pull requests as read`,
      action: (
        <button
          onClick={() => {
            // Restore previous state
            setReadStatuses(previousState);
            
            // Update pull requests state based on previous read statuses
            const revertedPullRequests = pullRequests.map(p => ({
              ...p,
              last_read_at: previousState[p.id]?.lastReadAt || null,
              has_new_activity: hasNewActivity(p, previousState[p.id])
            }));
            
            setPullRequests(revertedPullRequests);
            
            // Update repository and author groups
            setRepositoryGroups(groupPullRequestsByRepository(
              sortPullRequests(revertedPullRequests, sorting)
            ));
            
            setAuthorGroups(groupPullRequestsByAuthor(
              sortPullRequests(revertedPullRequests, sorting)
            ));
            
            // Save reverted state to storage
            saveReadStatusToStorage(previousState);
            dismiss();
          }}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-8 px-3 py-2"
        >
          <span>Undo</span>
        </button>
      ),
    });
  }, [pullRequests, readStatuses, filteredUsers, sorting, toast, filteredPullRequests]);
  
  return {
    pullRequests,
    repositoryGroups,
    authorGroups,
    loading,
    error,
    fetchData,
    handleMarkAsRead,
    handleMarkAllAsRead,
    filteredPullRequests,
    filteredRepositoryGroups,
    filteredAuthorGroups,
    uniqueUsers,
    unreadCount
  };
}

// Import hasNewActivity and saveReadStatusToStorage for local use
import { hasNewActivity, saveReadStatusToStorage } from '@/lib/readStatusService';
