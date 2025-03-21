import React from 'react';
import { GitHubUser } from '../lib/types';
import { UserCheck } from 'lucide-react';

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
  
  const handleSelectSingleUser = (login: string) => {
    if (selectedUsers.length === 1 && selectedUsers[0] === login) {
      return;
    }
    onChange([login]);
  };
  
  const handleSelectAll = () => {
    if (selectedUsers.length > 0) {
      onChange([]);
    } else {
      onChange(users.map(u => u.login));
    }
  };
  
  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;
  
  return (
    <div className="pb-4 mb-6 border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">Filter by User</h2>
        <button
          onClick={handleSelectAll}
          className="text-xs text-primary hover:underline focus:outline-none"
        >
          {selectedUsers.length > 0 ? 'Clear All' : 'Select All'}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {users.map((user) => {
          const isSelected = selectedUsers.includes(user.login);
          return (
            <div key={user.id} className="relative group">
              <button
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
              
              <button
                onClick={() => handleSelectSingleUser(user.login)}
                className={`
                  absolute -right-2 -top-2 bg-primary text-white p-1 rounded-full
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                `}
                title={`Show only ${user.login}'s pull requests`}
              >
                <UserCheck size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserFilters;
