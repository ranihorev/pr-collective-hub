
import React, { useState, useEffect } from 'react';
import { useGitHubSettings } from '@/hooks/use-github-settings';
import { usePullRequests } from '@/hooks/use-pull-requests';
import { GitHubSettings as GitHubSettingsType, GroupingOption, SortingOption } from '@/lib/types';
import EmptyState from './EmptyState';
import UserFilters from './UserFilters';
import RepositoryGroup from './RepositoryGroup';
import AuthorGroupList from './AuthorGroupList';
import GitHubSettings from './GitHubSettings';
import GitHubHeader from './GitHubHeader';
import GitHubFilters from './GitHubFilters';

interface GitHubInboxProps {
  initialSettings?: GitHubSettingsType;
}

const DEFAULT_SETTINGS: GitHubSettingsType = {
  organization: '',
  users: [],
  token: '',
};

const GitHubInbox: React.FC<GitHubInboxProps> = ({ 
  initialSettings = DEFAULT_SETTINGS 
}) => {
  // Settings state
  const { settings, updateSettings } = useGitHubSettings(initialSettings);
  
  // UI state
  const [grouping, setGrouping] = useState<GroupingOption>('repository');
  const [sorting, setSorting] = useState<SortingOption>('updated');
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(
    !settings.organization || !settings.token || settings.users.length === 0
  );
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(true);
  const [showDrafts, setShowDrafts] = useState<boolean>(false); // Hide drafts by default
  
  // Initialize filteredUsers from settings
  useEffect(() => {
    if (filteredUsers.length === 0 && settings.users.length > 0) {
      setFilteredUsers(settings.users);
    }
  }, [settings.users, filteredUsers]);
  
  // Pull requests data and operations
  const {
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
  } = usePullRequests(settings, sorting, filteredUsers, showUnreadOnly, showDrafts);
  
  // Fetch data when settings change
  useEffect(() => {
    if (settings.organization && settings.token && settings.users.length > 0) {
      fetchData();
    }
  }, [settings, fetchData]);
  
  const handleSettingsSubmit = (newSettings: GitHubSettingsType) => {
    updateSettings(newSettings);
    setFilteredUsers(newSettings.users);
    setShowSettings(false);
  };
  
  const handleRefresh = () => {
    fetchData();
  };
  
  const renderContent = () => {
    if (loading && filteredPullRequests.length === 0) {
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
          message={showUnreadOnly 
            ? "No unread pull requests found. Try showing all PRs." 
            : "No pull requests found for the selected filters."}
          onRetry={handleRefresh}
        />
      );
    }
    
    if (grouping === 'repository') {
      return (
        <div className="space-y-6">
          {filteredRepositoryGroups.map(group => (
            <RepositoryGroup 
              key={group.id} 
              group={group} 
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      );
    } else {
      return (
        <AuthorGroupList 
          groups={filteredAuthorGroups} 
          sorting={sorting}
          onMarkAsRead={handleMarkAsRead}
        />
      );
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col">
        <header className="mb-8">
          <GitHubHeader 
            unreadCount={unreadCount}
            hasFilteredPullRequests={filteredPullRequests.length > 0}
            loading={loading}
            showSettings={showSettings}
            onMarkAllAsRead={handleMarkAllAsRead}
            onRefresh={handleRefresh}
            onToggleSettings={() => setShowSettings(!showSettings)}
          />
          
          {showSettings && (
            <GitHubSettings 
              settings={settings}
              onSubmit={handleSettingsSubmit}
              onCancel={() => setShowSettings(false)}
            />
          )}
          
          {filteredPullRequests.length > 0 && !showSettings && (
            <GitHubFilters
              grouping={grouping}
              sorting={sorting}
              showUnreadOnly={showUnreadOnly}
              showDrafts={showDrafts}
              onGroupingChange={setGrouping}
              onSortingChange={setSorting}
              onShowUnreadOnlyChange={setShowUnreadOnly}
              onShowDraftsChange={setShowDrafts}
            />
          )}
        </header>
        
        {filteredPullRequests.length > 0 && !showSettings && (
          <div className="mb-6">
            <UserFilters 
              users={uniqueUsers}
              selectedUsers={filteredUsers}
              onChange={setFilteredUsers}
            />
          </div>
        )}
        
        <main className="pb-12">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default GitHubInbox;
