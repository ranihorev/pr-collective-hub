
import React, { useState } from 'react';
import { RepositoryGroup as RepoGroup } from '../lib/types';
import PullRequestCard from './PullRequestCard';
import { ChevronDown, ChevronUp, Github } from 'lucide-react';

interface RepositoryGroupProps {
  group: RepoGroup;
  isExpanded?: boolean;
}

const RepositoryGroup: React.FC<RepositoryGroupProps> = ({ 
  group,
  isExpanded: initialExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
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
              <span className="text-sm bg-secondary px-2 py-0.5 rounded-full">
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RepositoryGroup;
