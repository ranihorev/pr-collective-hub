
import React from 'react';
import { cn } from '@/lib/utils';
import { GroupingOption, SortingOption } from '@/lib/types';
import { 
  SlidersHorizontal,
  Clock,
  Calendar,
  FolderGit2,
  UserSquare2,
  Bell,
  Eye,
  FileEdit,
  FileCheck
} from 'lucide-react';

interface GitHubFiltersProps {
  grouping: GroupingOption;
  sorting: SortingOption;
  showUnreadOnly: boolean;
  showDrafts: boolean;
  onGroupingChange: (grouping: GroupingOption) => void;
  onSortingChange: (sorting: SortingOption) => void;
  onShowUnreadOnlyChange: (showUnreadOnly: boolean) => void;
  onShowDraftsChange: (showDrafts: boolean) => void;
}

const GitHubFilters: React.FC<GitHubFiltersProps> = ({ 
  grouping, 
  sorting, 
  showUnreadOnly,
  showDrafts,
  onGroupingChange,
  onSortingChange,
  onShowUnreadOnlyChange,
  onShowDraftsChange
}) => {
  return (
    <>
      <div className="glass rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Group By:</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onGroupingChange('repository')}
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
              onClick={() => onGroupingChange('author')}
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
              onClick={() => onSortingChange('updated')}
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
              onClick={() => onSortingChange('created')}
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
      
      <div className="mb-6">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => onShowUnreadOnlyChange(!showUnreadOnly)}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors",
              showUnreadOnly
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {showUnreadOnly ? (
              <>
                <Bell className="w-3.5 h-3.5 mr-1" />
                Unread only
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1" />
                Show all
              </>
            )}
          </button>
          
          <button
            onClick={() => onShowDraftsChange(!showDrafts)}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors",
              showDrafts
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {showDrafts ? (
              <>
                <FileEdit className="w-3.5 h-3.5 mr-1" />
                Showing drafts
              </>
            ) : (
              <>
                <FileCheck className="w-3.5 h-3.5 mr-1" />
                Hiding drafts
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default GitHubFilters;
