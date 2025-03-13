
import React from 'react';
import GitHubInbox from '@/components/GitHubInbox';
import { GitHubSettings } from '@/lib/types';

const Index = () => {
  const loaded = React.useRef(false);
  
  let settings: GitHubSettings | undefined = undefined; 
  if (!loaded.current) {
    const saved = localStorage.getItem('github-inbox-settings');
    if (saved) {
      try {
        settings = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse saved settings', error);
      }
    }
    loaded.current = true;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <GitHubInbox initialSettings={settings} />
    </div>
  );
};

export default Index;
