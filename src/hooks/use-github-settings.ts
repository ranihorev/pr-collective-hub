
import { useState, useEffect } from 'react';
import { GitHubSettings } from '@/lib/types';
import { getToken, isAuthenticated } from '@/lib/githubOAuth';

const DEFAULT_SETTINGS: GitHubSettings = {
  organization: '',
  users: [],
  token: '', // Will be filled from OAuth
};

export function useGitHubSettings(initialSettings: GitHubSettings = DEFAULT_SETTINGS) {
  const [settings, setSettings] = useState<GitHubSettings>(initialSettings);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('github-inbox-settings');
      const oauthToken = getToken();
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Add the OAuth token to the settings
        if (oauthToken) {
          parsedSettings.token = oauthToken;
        }
        setSettings(parsedSettings);
      } else if (oauthToken) {
        // If we have an OAuth token but no settings, update the default settings
        setSettings({
          ...DEFAULT_SETTINGS,
          token: oauthToken
        });
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);
  
  const updateSettings = (newSettings: GitHubSettings) => {
    // The OAuth token is managed separately, so we use the existing token
    const oauthToken = getToken();
    const settingsToSave = {
      ...newSettings,
      // Only use the token from settings if no OAuth token is available
      token: oauthToken || newSettings.token
    };
    
    setSettings(settingsToSave);
    
    // Save to localStorage (without the token)
    try {
      const settingsForStorage = {
        organization: settingsToSave.organization,
        users: settingsToSave.users,
        // Don't store the token in the settings object since it's managed by OAuth
        token: ''
      };
      localStorage.setItem('github-inbox-settings', JSON.stringify(settingsForStorage));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  };
  
  return { settings, updateSettings };
}
