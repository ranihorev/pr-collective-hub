
import React from 'react';
import { AuthorGroup, PullRequest } from '@/lib/types';
import PullRequestCard from './PullRequestCard';
import { sortPullRequests } from '@/lib/githubApi';

interface AuthorGroupListProps {
  groups: AuthorGroup[];
  sorting: "updated" | "created";
  onMarkAsRead: (pr: PullRequest) => void;
}

const AuthorGroupList: React.FC<AuthorGroupListProps> = ({ 
  groups, 
  sorting,
  onMarkAsRead 
}) => {
  return (
    <div className="space-y-8">
      {groups.map(group => (
        <div key={group.user.id} className="animate-slide-in stagger-item">
          <div className="flex items-center gap-2 mb-4">
            <img 
              src={group.user.avatar_url} 
              alt={group.user.login}
              className="w-6 h-6 rounded-full"
            />
            <h2 className="font-medium">{group.user.login}</h2>
            <span className={`text-sm px-2 py-0.5 rounded-full ${
              group.pullRequests.some(pr => pr.has_new_activity) 
                ? 'bg-primary text-white' 
                : 'bg-secondary'
            }`}>
              {group.pullRequests.length}
            </span>
          </div>
          <div className="space-y-3">
            {sortPullRequests(group.pullRequests, sorting).map(pr => (
              <PullRequestCard 
                key={pr.id} 
                pullRequest={pr} 
                onMarkAsRead={onMarkAsRead} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuthorGroupList;
