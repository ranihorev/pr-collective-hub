
import React, { useEffect, useState } from 'react';
import GitHubInbox from '@/components/GitHubInbox';
import { GitHubSettings } from '@/lib/types';

const Index = () => {
  const [savedSettings, setSavedSettings] = useState<GitHubSettings | undefined>();
  
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('github-inbox-settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          setSavedSettings(settings);
        } catch (error) {
          console.error('Failed to parse saved settings', error);
        }
      }
    };
    
    loadSettings();
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <GitHubInbox initialSettings={savedSettings} />
    </div>
  );
};

export default Index;
