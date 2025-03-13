import React from 'react';
import { formatDate } from '../lib/githubApi';
import { PullRequest } from '../lib/types';
import { 
  GitPullRequest, 
  GitMerge, 
  Clock, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Bell,
  ShieldCheck,
  ShieldX,
  MessageSquare,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PullRequestCardProps {
  pullRequest: PullRequest;
  isStaggered?: boolean;
  onMarkAsRead?: (pr: PullRequest) => void;
}

const PullRequestCard: React.FC<PullRequestCardProps> = ({ 
  pullRequest,
  isStaggered = true,
  onMarkAsRead
}) => {
  const { title, html_url, user, updated_at, draft, has_new_activity, review_status, reviewers } = pullRequest;
  
  const isPrOpen = pullRequest.state === 'open';
  const isPrMerged = pullRequest.merged_at !== null;
  
  const statusIcon = () => {
    if (draft) return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    if (isPrMerged) return <GitMerge className="w-4 h-4 text-github-merged" />;
    return <GitPullRequest className="w-4 h-4 text-github-pull" />;
  };
  
  const statusText = () => {
    if (draft) return 'Draft';
    if (isPrMerged) return 'Merged';
    if (isPrOpen) return 'Open';
    return 'Closed';
  };
  
  const statusClass = () => {
    if (draft) return 'text-muted-foreground';
    if (isPrMerged) return 'text-github-merged';
    if (isPrOpen) return 'text-github-open';
    return 'text-github-closed';
  };
  
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(pullRequest);
    }
  };
  
  const renderReviewStatus = () => {
    if (!review_status || review_status === "NONE") {
      return null;
    }
    
    const reviewersList = reviewers ? Object.entries(reviewers) : [];
    const approvedReviewers = reviewersList.filter(([_, state]) => state === "APPROVED").map(([name]) => name);
    const changesRequestedReviewers = reviewersList.filter(([_, state]) => state === "CHANGES_REQUESTED").map(([name]) => name);
    const commentedReviewers = reviewersList.filter(([_, state]) => state === "COMMENTED").map(([name]) => name);
    
    const hasReviewers = reviewersList.length > 0;
    
    const renderTooltipContent = () => (
      <div className="space-y-2 max-w-xs">
        {approvedReviewers.length > 0 && (
          <div>
            <div className="font-medium text-green-500 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Approved by:
            </div>
            <div className="text-xs ml-4">
              {approvedReviewers.map(name => (
                <div key={name}>{name}</div>
              ))}
            </div>
          </div>
        )}
        
        {changesRequestedReviewers.length > 0 && (
          <div>
            <div className="font-medium text-red-500 flex items-center gap-1">
              <UserX className="w-3.5 h-3.5" /> Changes requested by:
            </div>
            <div className="text-xs ml-4">
              {changesRequestedReviewers.map(name => (
                <div key={name}>{name}</div>
              ))}
            </div>
          </div>
        )}
        
        {commentedReviewers.length > 0 && (
          <div>
            <div className="font-medium text-blue-500 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Commented by:
            </div>
            <div className="text-xs ml-4">
              {commentedReviewers.map(name => (
                <div key={name}>{name}</div>
              ))}
            </div>
          </div>
        )}
        
        {!hasReviewers && (
          <div className="text-sm">No reviewers yet</div>
        )}
      </div>
    );
    
    switch (review_status) {
      case "APPROVED":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-green-600" title="Approved">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-medium">Approved</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {renderTooltipContent()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "CHANGES_REQUESTED":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-red-500" title="Changes requested">
                  <ShieldX className="w-4 h-4" />
                  <span className="text-xs font-medium">Changes requested</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {renderTooltipContent()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "COMMENTED":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-blue-500" title="Reviewed with comments">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-medium">Reviewed</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {renderTooltipContent()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return null;
    }
  };
  
  return (
    <a 
      href={html_url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`
        block p-5 rounded-xl bg-white border border-border/50 shadow-sm
        hover:shadow-md transition-all duration-300 ease-in-out
        hover:scale-[1.01] focus:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary/20
        ${has_new_activity ? 'border-l-4 border-l-primary' : ''}
        ${isStaggered ? 'stagger-item animate-fade-in' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <img 
            src={user.avatar_url} 
            alt={user.login}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center">
              {statusIcon()}
              <span className={`text-sm font-medium ml-1 ${statusClass()}`}>
                {statusText()}
              </span>
            </div>
            
            <span className="text-muted-foreground text-sm">#{pullRequest.number}</span>
            
            {has_new_activity && (
              <div className="flex items-center">
                <Bell className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            
            {renderReviewStatus()}
            
            <div className="flex-1"></div>
            
            <button
              onClick={handleMarkAsRead}
              className="p-1 rounded-full hover:bg-secondary transition-colors"
              aria-label={has_new_activity ? "Mark as read" : "Mark as unread"}
              title={has_new_activity ? "Mark as read" : "Mark as unread"}
            >
              {has_new_activity ? (
                <Eye className="w-4 h-4 text-muted-foreground" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              <span className="text-xs">{formatDate(updated_at)}</span>
            </div>
          </div>
          
          <h3 className="font-medium text-foreground leading-tight mb-2 truncate">
            {title}
          </h3>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <span>by </span>
            <span className="font-medium ml-1">{user.login}</span>
            
            {pullRequest.comments_count > 0 && (
              <span className="ml-2 text-xs flex items-center">
                <span className="mr-1">•</span> {pullRequest.comments_count} comment{pullRequest.comments_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
};

export default PullRequestCard;
