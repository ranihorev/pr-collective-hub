
import React from 'react';
import { GitHubSettings as GitHubSettingsType } from '@/lib/types';
import { ExternalLink, Github } from 'lucide-react';
import { initiateOAuthLogin, isAuthenticated, logout } from '@/lib/githubOAuth';
import { Button } from '@/components/ui/button';

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
  const isLoggedIn = isAuthenticated();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const organization = formData.get('organization') as string;
    const usersText = formData.get('users') as string;
    
    const users = usersText
      .split(',')
      .map(user => user.trim())
      .filter(Boolean);
    
    const newSettings = {
      organization,
      users,
      token: settings.token, // Keep the existing token
    };
    
    onSubmit(newSettings);
  };
  
  const handleGitHubLogin = () => {
    initiateOAuthLogin();
  };
  
  const handleLogout = () => {
    logout();
    // Reload the page to reset the state
    window.location.reload();
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
        
        <div className="border-t border-border/50 pt-4">
          <label className="block text-sm font-medium mb-3">
            GitHub Authentication
          </label>
          
          {isLoggedIn ? (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center text-sm bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 p-2 rounded">
                <span className="mr-2">✓</span> Connected to GitHub
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="w-fit"
              >
                Disconnect from GitHub
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Connect to GitHub to access pull requests. This app requires access to your repositories.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGitHubLogin}
                className="flex items-center gap-2"
              >
                <Github size={16} />
                Connect to GitHub
              </Button>
            </div>
          )}
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
            disabled={!isLoggedIn}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default GitHubSettings;
