import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchPullRequests, 
  groupPullRequestsByRepository, 
  groupPullRequestsByAuthor,
  sortPullRequests
} from '../lib/githubApi';
import { 
  GitHubSettings, 
  PullRequest, 
  RepositoryGroup as RepoGroup,
  AuthorGroup,
  GroupingOption,
  SortingOption
} from '../lib/types';
import EmptyState from './EmptyState';
import UserFilters from './UserFilters';
import RepositoryGroup from './RepositoryGroup';
import PullRequestCard from './PullRequestCard';
import { 
  GitPullRequest,
  Users,
  SlidersHorizontal,
  Clock,
  Calendar,
  Settings,
  RefreshCw,
  UserSquare2,
  FolderGit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GitHubInboxProps {
  initialSettings?: GitHubSettings;
}

const DEFAULT_SETTINGS: GitHubSettings = {
  organization: '',
  users: [],
  token: '',
};

const GitHubInbox: React.FC<GitHubInboxProps> = ({ 
  initialSettings = DEFAULT_SETTINGS 
}) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GitHubSettings>(initialSettings);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [repositoryGroups, setRepositoryGroups] = useState<RepoGroup[]>([]);
  const [authorGroups, setAuthorGroups] = useState<AuthorGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grouping, setGrouping] = useState<GroupingOption>('repository');
  const [sorting, setSorting] = useState<SortingOption>('updated');
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(
    !settings.organization || settings.users.length === 0
  );
  
  const fetchData = useCallback(async () => {
    if (!settings.organization || settings.users.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const prs = await fetchPullRequests(settings);
      setPullRequests(prs);
      
      const repoGroups = groupPullRequestsByRepository(
        sortPullRequests(prs, sorting)
      );
      setRepositoryGroups(repoGroups);
      
      const userGroups = groupPullRequestsByAuthor(
        sortPullRequests(prs, sorting)
      );
      setAuthorGroups(userGroups);
      
      if (filteredUsers.length === 0) {
        setFilteredUsers(settings.users);
      }
      
      if (prs.length === 0) {
        toast({
          title: "No pull requests found",
          description: "Try adding more users or check your organization name."
        });
      } else {
        toast({
          title: "Pull requests updated",
          description: `Found ${prs.length} open pull requests.`
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
  }, [settings, sorting, filteredUsers, toast]);
  
  useEffect(() => {
    if (settings.organization && settings.users.length > 0) {
      fetchData();
    }
  }, [fetchData]);
  
  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const organization = formData.get('organization') as string;
    const usersText = formData.get('users') as string;
    const token = formData.get('token') as string;
    
    const users = usersText
      .split(',')
      .map(user => user.trim())
      .filter(Boolean);
    
    const newSettings = {
      organization,
      users,
      token: token || '',
    };
    
    setSettings(newSettings);
    setFilteredUsers(users);
    setShowSettings(false);
    
    localStorage.setItem('github-inbox-settings', JSON.stringify(newSettings));
    
    fetchData();
  };
  
  const filteredPullRequests = pullRequests.filter(pr => 
    filteredUsers.includes(pr.user.login)
  );
  
  const filteredRepositoryGroups = repositoryGroups.map(group => ({
    ...group,
    pullRequests: group.pullRequests.filter(pr => 
      filteredUsers.includes(pr.user.login)
    ),
  })).filter(group => group.pullRequests.length > 0);
  
  const filteredAuthorGroups = authorGroups.filter(group => 
    filteredUsers.includes(group.user.login)
  );
  
  const handleRefresh = () => {
    fetchData();
  };
  
  const renderContent = () => {
    if (loading && pullRequests.length === 0) {
      return <EmptyState type="loading" />;
    }
    
    if (error) {
      return (
        <EmptyState 
          type="error" 
          message={error}
          onRetry={handleRefresh}
        />
      );
    }
    
    if (!settings.organization || settings.users.length === 0) {
      return (
        <EmptyState 
          type="empty" 
          message="Configure your GitHub organization and users to start tracking pull requests."
          onRetry={() => setShowSettings(true)}
        />
      );
    }
    
    if (filteredPullRequests.length === 0) {
      return (
        <EmptyState 
          type="empty" 
          message="No pull requests found for the selected filters."
          onRetry={handleRefresh}
        />
      );
    }
    
    if (grouping === 'repository') {
      return (
        <div className="space-y-6">
          {filteredRepositoryGroups.map(group => (
            <RepositoryGroup key={group.id} group={group} />
          ))}
        </div>
      );
    } else {
      return (
        <div className="space-y-8">
          {filteredAuthorGroups.map(group => (
            <div key={group.user.id} className="animate-slide-in stagger-item">
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src={group.user.avatar_url} 
                  alt={group.user.login}
                  className="w-6 h-6 rounded-full"
                />
                <h2 className="font-medium">{group.user.login}</h2>
                <span className="text-sm bg-secondary px-2 py-0.5 rounded-full">
                  {group.pullRequests.length}
                </span>
              </div>
              <div className="space-y-3">
                {sortPullRequests(group.pullRequests, sorting).map(pr => (
                  <PullRequestCard key={pr.id} pullRequest={pr} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
  };
  
  const uniqueUsers = Array.from(
    new Map(
      pullRequests.map(pr => [pr.user.login, pr.user])
    ).values()
  );
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <GitPullRequest className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-2xl font-semibold">GitHub Inbox</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  "hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20",
                  loading && "animate-spin"
                )}
                aria-label="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  "hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20",
                  showSettings && "bg-secondary"
                )}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {showSettings && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 mb-6 animate-fade-in">
              <h2 className="text-lg font-medium mb-4">GitHub Settings</h2>
              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium mb-1">
                    Organization Name
                  </label>
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    defaultValue={settings.organization}
                    required
                    placeholder="e.g., github"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                
                <div>
                  <label htmlFor="users" className="block text-sm font-medium mb-1">
                    GitHub Usernames
                  </label>
                  <textarea
                    id="users"
                    name="users"
                    defaultValue={settings.users.join(', ')}
                    required
                    placeholder="e.g., user1, user2, user3"
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated list of GitHub usernames
                  </p>
                </div>
                
                <div>
                  <label htmlFor="token" className="block text-sm font-medium mb-1">
                    GitHub Token (Optional)
                  </label>
                  <input
                    id="token"
                    name="token"
                    type="password"
                    defaultValue={settings.token}
                    placeholder="GitHub personal access token"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A token increases API rate limits and allows access to private repositories
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 border border-input rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {pullRequests.length > 0 && !showSettings && (
            <div className="glass rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Group By:</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setGrouping('repository')}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm flex items-center gap-1",
                      grouping === 'repository' 
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    <FolderGit2 className="w-3.5 h-3.5 mr-1" />
                    Repository
                  </button>
                  <button
                    onClick={() => setGrouping('author')}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm flex items-center gap-1",
                      grouping === 'author' 
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    <UserSquare2 className="w-3.5 h-3.5 mr-1" />
                    Author
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort By:</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSorting('updated')}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm flex items-center gap-1",
                      sorting === 'updated' 
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Updated
                  </button>
                  <button
                    onClick={() => setSorting('created')}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm flex items-center gap-1",
                      sorting === 'created' 
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Created
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>
        
        {pullRequests.length > 0 && !showSettings && (
          <UserFilters 
            users={uniqueUsers}
            selectedUsers={filteredUsers}
            onChange={setFilteredUsers}
          />
        )}
        
        <main className="pb-12">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default GitHubInbox;
