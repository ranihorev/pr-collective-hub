
import React from 'react';
import { GitHubUser } from '../lib/types';

interface UserFiltersProps {
  users: GitHubUser[];
  selectedUsers: string[];
  onChange: (selectedUsers: string[]) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({ 
  users, 
  selectedUsers,
  onChange
}) => {
  const handleToggleUser = (login: string) => {
    if (selectedUsers.includes(login)) {
      onChange(selectedUsers.filter(u => u !== login));
    } else {
      onChange([...selectedUsers, login]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      onChange([]);
    } else {
      onChange(users.map(u => u.login));
    }
  };
  
  return (
    <div className="pb-4 mb-6 border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">Filter by User</h2>
        <button
          onClick={handleSelectAll}
          className="text-xs text-primary hover:underline focus:outline-none"
        >
          {selectedUsers.length === users.length ? 'Clear All' : 'Select All'}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {users.map((user) => {
          const isSelected = selectedUsers.includes(user.login);
          return (
            <button
              key={user.id}
              onClick={() => handleToggleUser(user.login)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                transition-all duration-200 
                ${isSelected 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}
              `}
            >
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-5 h-5 rounded-full"
              />
              <span>{user.login}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UserFilters;
