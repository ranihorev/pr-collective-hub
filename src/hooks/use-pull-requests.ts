
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
  markPullRequestAsRead
} from '@/lib/readStatusService';

export function usePullRequests(
  settings: GitHubSettings,
  sorting: SortingOption,
  filteredUsers: string[],
  showUnreadOnly: boolean
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
    filteredUsers.includes(pr.user.login)
  ).filter(pr => !showUnreadOnly || pr.has_new_activity);
  
  // Filtered repository and author groups
  const filteredRepositoryGroups = repositoryGroups.map(group => ({
    ...group,
    pullRequests: group.pullRequests.filter(pr => {
      const userMatch = filteredUsers.includes(pr.user.login);
      const unreadMatch = !showUnreadOnly || pr.has_new_activity;
      return userMatch && unreadMatch;
    }),
  })).filter(group => group.pullRequests.length > 0);
  
  const filteredAuthorGroups = authorGroups
    .filter(group => filteredUsers.includes(group.user.login))
    .map(group => ({
      ...group,
      pullRequests: group.pullRequests.filter(pr => !showUnreadOnly || pr.has_new_activity)
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
      
      const unreadCount = prs.filter(pr => pr.has_new_activity).length;
      
      if (prs.length === 0) {
        toast({
          title: "No pull requests found",
          description: "Try adding more users or check your organization name."
        });
      } else {
        toast({
          title: `${prs.length} pull requests found`,
          description: unreadCount > 0 ? `${unreadCount} with new activity` : "All PRs are read"
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
  
  // Mark a single PR as read
  const handleMarkAsRead = useCallback((pr: PullRequest) => {
    const updatedReadStatuses = markPullRequestAsRead(pr, readStatuses);
    setReadStatuses(updatedReadStatuses);
    
    // Update the PullRequest in state
    const updatedPullRequests = pullRequests.map(p => {
      if (p.id === pr.id) {
        return {
          ...p,
          last_read_at: new Date().toISOString(),
          has_new_activity: false
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
    
    toast({
      title: "Marked as read",
      description: `"${pr.title}" is now marked as read`
    });
  }, [pullRequests, readStatuses, sorting, toast]);
  
  // Mark all filtered PRs as read
  const handleMarkAllAsRead = useCallback(() => {
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
    
    toast({
      title: "All marked as read",
      description: `Marked ${filteredPullRequests.length} pull requests as read`
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
