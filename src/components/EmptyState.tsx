
import React from 'react';
import { FolderOpen, GitPullRequest, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  type: 'empty' | 'loading' | 'error';
  message?: string;
  onRetry?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 h-96 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
        {type === 'empty' && <FolderOpen className="w-10 h-10 text-muted-foreground" />}
        {type === 'loading' && <RefreshCw className="w-10 h-10 text-primary animate-spin" />}
        {type === 'error' && (
          <div className="text-destructive text-3xl font-bold">!</div>
        )}
      </div>
      
      <h3 className="text-xl font-medium mb-2">
        {type === 'empty' && 'No Pull Requests Found'}
        {type === 'loading' && 'Loading Pull Requests'}
        {type === 'error' && 'Something Went Wrong'}
      </h3>
      
      <p className="text-muted-foreground text-center max-w-md">
        {message || 
          (type === 'empty' 
            ? 'Configure your GitHub organization and users to start tracking pull requests.'
            : type === 'loading'
              ? 'Fetching the latest pull requests from GitHub...'
              : 'Failed to load pull requests. Please check your settings and try again.'
          )
        }
      </p>
      
      {(type === 'error' || type === 'empty') && onRetry && (
        <button 
          onClick={onRetry}
          className="mt-6 px-4 py-2 rounded-full bg-primary text-white 
                    flex items-center gap-2 hover:bg-primary/90 transition-colors
                    shadow-sm hover:shadow-md active:scale-95 transform"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{type === 'error' ? 'Try Again' : 'Configure Settings'}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
