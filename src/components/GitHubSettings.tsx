
import React from 'react';
import { GitHubSettings as GitHubSettingsType } from '@/lib/types';

interface GitHubSettingsProps {
  settings: GitHubSettingsType;
  onSubmit: (settings: GitHubSettingsType) => void;
  onCancel: () => void;
}

const GitHubSettings: React.FC<GitHubSettingsProps> = ({ 
  settings, 
  onSubmit, 
  onCancel 
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const organization = formData.get('organization') as string;
    const usersText = formData.get('users') as string;
    const token = formData.get('token') as string;
    
    const users = usersText
      .split(',')
      .map(user => user.trim())
      .filter(Boolean);
    
    const newSettings = {
      organization,
      users,
      token: token || '',
    };
    
    onSubmit(newSettings);
  };
  
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 mb-6 animate-fade-in">
      <h2 className="text-lg font-medium mb-4">GitHub Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="organization" className="block text-sm font-medium mb-1">
            Organization Name
          </label>
          <input
            id="organization"
            name="organization"
            type="text"
            defaultValue={settings.organization}
            required
            placeholder="e.g., github"
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div>
          <label htmlFor="users" className="block text-sm font-medium mb-1">
            GitHub Usernames
          </label>
          <textarea
            id="users"
            name="users"
            defaultValue={settings.users.join(', ')}
            required
            placeholder="e.g., user1, user2, user3"
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Comma-separated list of GitHub usernames
          </p>
        </div>
        
        <div>
          <label htmlFor="token" className="block text-sm font-medium mb-1">
            GitHub Token (Optional)
          </label>
          <input
            id="token"
            name="token"
            type="password"
            defaultValue={settings.token}
            placeholder="GitHub personal access token"
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground mt-1">
            A token increases API rate limits and allows access to private repositories
          </p>
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-input rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default GitHubSettings;
