
import React, { useState } from 'react';
import { RepositoryGroup as RepoGroup, PullRequest } from '../lib/types';
import PullRequestCard from './PullRequestCard';
import { ChevronDown, ChevronUp, Github } from 'lucide-react';

interface RepositoryGroupProps {
  group: RepoGroup;
  isExpanded?: boolean;
  onMarkAsRead?: (pr: PullRequest) => void;
}

const RepositoryGroup: React.FC<RepositoryGroupProps> = ({ 
  group,
  isExpanded: initialExpanded = true,
  onMarkAsRead
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  const hasUnreadPRs = group.pullRequests.some(pr => pr.has_new_activity);
  
  return (
    <div className="mb-6 animate-slide-in stagger-item">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5 text-foreground/70" />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 font-medium text-lg hover:text-primary transition-colors focus:outline-none"
          >
            <span>{group.name}</span>
            {group.pullRequests.length > 0 && (
              <span className={`text-sm px-2 py-0.5 rounded-full ${hasUnreadPRs ? 'bg-primary text-white' : 'bg-secondary'}`}>
                {group.pullRequests.length}
              </span>
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-3">
          {group.pullRequests.map((pr) => (
            <PullRequestCard 
              key={pr.id} 
              pullRequest={pr} 
              isStaggered={false}
              onMarkAsRead={onMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RepositoryGroup;
