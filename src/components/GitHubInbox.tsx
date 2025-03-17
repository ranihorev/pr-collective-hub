
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

// Get a value from localStorage with a default fallback
const getStoredValue = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Save a value to localStorage
const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const GitHubInbox: React.FC<GitHubInboxProps> = ({ 
  initialSettings = DEFAULT_SETTINGS 
}) => {
  // Settings state
  const { settings, updateSettings } = useGitHubSettings(initialSettings);
  
  // UI state with localStorage persistence
  const [grouping, setGrouping] = useState<GroupingOption>(
    getStoredValue('github-inbox-grouping', 'repository')
  );
  const [sorting, setSorting] = useState<SortingOption>(
    getStoredValue('github-inbox-sorting', 'updated')
  );
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(
    !settings.organization || !settings.token || settings.users.length === 0
  );
  
  // Filter toggles with localStorage persistence
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(
    getStoredValue('github-inbox-show-unread-only', true)
  );
  const [showDrafts, setShowDrafts] = useState<boolean>(
    getStoredValue('github-inbox-show-drafts', false)
  );
  const [hideApproved, setHideApproved] = useState<boolean>(
    getStoredValue('github-inbox-hide-approved', false)
  );
  
  // Save filter states to localStorage when they change
  useEffect(() => {
    saveToStorage('github-inbox-grouping', grouping);
  }, [grouping]);
  
  useEffect(() => {
    saveToStorage('github-inbox-sorting', sorting);
  }, [sorting]);
  
  useEffect(() => {
    saveToStorage('github-inbox-show-unread-only', showUnreadOnly);
  }, [showUnreadOnly]);
  
  useEffect(() => {
    saveToStorage('github-inbox-show-drafts', showDrafts);
  }, [showDrafts]);
  
  useEffect(() => {
    saveToStorage('github-inbox-hide-approved', hideApproved);
  }, [hideApproved]);
  
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
  } = usePullRequests(settings, sorting, filteredUsers, showUnreadOnly, showDrafts, hideApproved);
  
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
        </header>
        
        {filteredPullRequests.length > 0 && !showSettings && (
          <div className="sticky top-0 z-10 pt-4 pb-2 bg-background/95 backdrop-blur-sm">
            <GitHubFilters
              grouping={grouping}
              sorting={sorting}
              showUnreadOnly={showUnreadOnly}
              showDrafts={showDrafts}
              hideApproved={hideApproved}
              onGroupingChange={setGrouping}
              onSortingChange={setSorting}
              onShowUnreadOnlyChange={setShowUnreadOnly}
              onShowDraftsChange={setShowDrafts}
              onHideApprovedChange={setHideApproved}
            />
            
            <div>
              <UserFilters 
                users={uniqueUsers}
                selectedUsers={filteredUsers}
                onChange={setFilteredUsers}
              />
            </div>
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
