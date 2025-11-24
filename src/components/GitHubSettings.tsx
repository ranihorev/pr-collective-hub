
import React from 'react';
import { GitHubSettings as GitHubSettingsType } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

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
    const currentUser = formData.get('currentUser') as string;
    
    const users = usersText
      .split(',')
      .map(user => user.trim())
      .filter(Boolean);
    
    const newSettings = {
      organization,
      users,
      token,
      currentUser: currentUser || undefined,
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
          <label htmlFor="currentUser" className="block text-sm font-medium mb-1">
            Your GitHub Username
          </label>
          <input
            id="currentUser"
            name="currentUser"
            type="text"
            defaultValue={settings.currentUser || ''}
            placeholder="e.g., yourusername"
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground mt-1">
            PRs where your latest review is the last activity will be automatically marked as read
          </p>
        </div>
        
        <div>
          <label htmlFor="token" className="block text-sm font-medium mb-1">
            GitHub Token
            <a 
              href="https://github.com/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ml-2 inline-flex items-center text-primary hover:text-primary/80 transition-colors"
            >
              Generate token <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </label>
          <input
            id="token"
            name="token"
            type="password"
            defaultValue={settings.token}
            required
            placeholder="GitHub personal access token"
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-xs font-medium text-foreground mb-1">
              Required token scopes:
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5 ml-4 list-disc">
              <li><code className="bg-muted px-1 py-0.5 rounded">repo</code> - Full control (recommended for private repos)</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">public_repo</code> - Access to public repos only</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Enterprise organizations:</strong> After creating the token, click "Configure SSO" to authorize it for your organization.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Token is stored locally and never sent to any server other than GitHub's API
            </p>
          </div>
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
