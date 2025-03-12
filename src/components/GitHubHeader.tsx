
import React from 'react';
import { cn } from '@/lib/utils';
import { 
  GitPullRequest, 
  RefreshCw, 
  Settings,
  Eye,
  Bell
} from 'lucide-react';

interface GitHubHeaderProps {
  unreadCount: number;
  hasFilteredPullRequests: boolean;
  loading: boolean;
  showSettings: boolean;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
  onToggleSettings: () => void;
}

const GitHubHeader: React.FC<GitHubHeaderProps> = ({
  unreadCount,
  hasFilteredPullRequests,
  loading,
  showSettings,
  onMarkAllAsRead,
  onRefresh,
  onToggleSettings
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <GitPullRequest className="w-8 h-8 text-primary mr-3" />
        <h1 className="text-2xl font-semibold">GitHub Inbox</h1>
        {unreadCount > 0 && (
          <div className="ml-3 bg-primary text-white text-sm font-medium rounded-full px-2 py-0.5 flex items-center">
            <Bell className="w-3 h-3 mr-1" />
            {unreadCount}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {hasFilteredPullRequests && (
          <button
            onClick={onMarkAllAsRead}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md text-sm",
              "bg-secondary hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
            )}
            aria-label="Mark all as read"
          >
            <Eye className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
        
        <button
          onClick={onRefresh}
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
          onClick={onToggleSettings}
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
  );
};

export default GitHubHeader;
