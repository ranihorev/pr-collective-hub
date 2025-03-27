
import { useState, useEffect } from 'react';
import { GitHubSettings } from '@/lib/types';

const DEFAULT_SETTINGS: GitHubSettings = {
  organization: '',
  users: [],
  token: '',
  currentUser: undefined,
};

export function useGitHubSettings(initialSettings: GitHubSettings = DEFAULT_SETTINGS) {
  const [settings, setSettings] = useState<GitHubSettings>(initialSettings);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('github-inbox-settings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);
  
  const updateSettings = (newSettings: GitHubSettings) => {
    // Ensure token is not empty
    if (!newSettings.token) {
      throw new Error('GitHub token is required');
    }
    
    setSettings(newSettings);
    
    // Save to localStorage
    try {
      localStorage.setItem('github-inbox-settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  };
  
  return { settings, updateSettings };
}
