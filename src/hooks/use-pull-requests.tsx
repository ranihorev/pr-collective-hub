import React, { useState, useCallback, useEffect } from 'react';
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
  togglePullRequestReadStatus,
  hasNewActivity,
  saveReadStatusToStorage
} from '@/lib/readStatusService';
import { Button } from '@/components/ui/button';

export function usePullRequests(
  settings: GitHubSettings,
  sorting: SortingOption,
  filteredUsers: string[],
  showUnreadOnly: boolean = true, // Changed to true by default
  showDrafts: boolean = false
) {
  const { toast } = useToast();
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [repositoryGroups, setRepositoryGroups] = useState<RepositoryGroup[]>([]);
  const [authorGroups, setAuthorGroups] = useState<AuthorGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readStatuses, setReadStatuses] = useState<Record<number, ReadStatus>>({});
  const [previousReadStatuses, setPreviousReadStatuses] = useState<Record<number, ReadStatus>>({});
  
  useEffect(() => {
    setReadStatuses(getReadStatusFromStorage());
  }, []);
  
  const filteredPullRequests = pullRequests.filter(pr => 
    filteredUsers.includes(pr.user.login) && 
    (!showUnreadOnly || pr.has_new_activity) &&
    (showDrafts || !pr.draft)
  );
  
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
  
  const uniqueUsers = Array.from(
    new Map(
      pullRequests.map(pr => [pr.user.login, pr.user])
    ).values()
  );
  
  const unreadCount = filteredPullRequests.filter(pr => pr.has_new_activity).length;
  
  const undoReadStatusChanges = useCallback(() => {
    setReadStatuses(previousReadStatuses);
    saveReadStatusToStorage(previousReadStatuses);
    
    const updatedPullRequests = pullRequests.map(p => {
      const prevStatus = previousReadStatuses[p.id];
      if (prevStatus) {
        return {
          ...p,
          last_read_at: prevStatus.lastReadAt,
          has_new_activity: hasNewActivity(p, prevStatus)
        };
      }
      return {
        ...p,
        last_read_at: null,
        has_new_activity: true
      };
    });
    
    setPullRequests(updatedPullRequests);
    
    setRepositoryGroups(groupPullRequestsByRepository(
      sortPullRequests(updatedPullRequests, sorting)
    ));
    
    setAuthorGroups(groupPullRequestsByAuthor(
      sortPullRequests(updatedPullRequests, sorting)
    ));
    
    toast({
      title: "Read status restored",
      description: "Previous read status has been restored"
    });
  }, [previousReadStatuses, pullRequests, sorting, toast]);
  
  const fetchData = useCallback(async () => {
    if (!settings.organization || settings.users.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let prs = await fetchPullRequests(settings);
      
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
  
  const handleMarkAsRead = useCallback((pr: PullRequest) => {
    setPreviousReadStatuses(readStatuses);
    
    const updatedReadStatuses = togglePullRequestReadStatus(pr, readStatuses);
    setReadStatuses(updatedReadStatuses);
    
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
    
    const updatedRepoGroups = groupPullRequestsByRepository(
      sortPullRequests(updatedPullRequests, sorting)
    );
    setRepositoryGroups(updatedRepoGroups);
    
    const updatedAuthorGroups = groupPullRequestsByAuthor(
      sortPullRequests(updatedPullRequests, sorting)
    );
    setAuthorGroups(updatedAuthorGroups);
    
    toast({
      title: pr.has_new_activity ? "Marked as read" : "Marked as unread",
      description: `"${pr.title}" is now marked as ${pr.has_new_activity ? "read" : "unread"}`,
      action: (
        <Button variant="outline" size="sm" onClick={undoReadStatusChanges}>
          Undo
        </Button>
      )
    });
  }, [pullRequests, readStatuses, sorting, toast, undoReadStatusChanges]);
  
  const handleMarkAllAsRead = useCallback(() => {
    setPreviousReadStatuses(readStatuses);
    
    let updatedReadStatuses = { ...readStatuses };
    
    filteredPullRequests.forEach(pr => {
      updatedReadStatuses = markPullRequestAsRead(pr, updatedReadStatuses, pr.comments_count);
    });
    
    setReadStatuses(updatedReadStatuses);
    
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
      description: `Marked ${filteredPullRequests.length} pull requests as read`,
      action: (
        <Button variant="outline" size="sm" onClick={undoReadStatusChanges}>
          Undo
        </Button>
      )
    });
  }, [pullRequests, readStatuses, filteredUsers, sorting, toast, filteredPullRequests, undoReadStatusChanges]);
  
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
