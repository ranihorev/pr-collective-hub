
/**
 * GitHub OAuth implementation
 * This handles the OAuth flow with GitHub and token storage
 */

// GitHub OAuth configuration
// These should be provided by the user after creating an OAuth app on GitHub
const GITHUB_CLIENT_ID = "Ov23liuUfarqOWlXQjwA"; // Replace with your GitHub OAuth app client ID
const GITHUB_REDIRECT_URI = window.location.origin; // Use the current origin as the redirect URI
const GITHUB_SCOPE = "repo"; // Scope needed for repository access

const STORAGE_KEY = "github-oauth-token";

// Generate a random state value for OAuth security
const generateState = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Store the OAuth state in localStorage for verification
const storeState = (state: string): void => {
  localStorage.setItem("github-oauth-state", state);
};

// Verify the returned state matches the stored state
const verifyState = (returnedState: string): boolean => {
  const storedState = localStorage.getItem("github-oauth-state");
  return storedState === returnedState;
};

// Store the OAuth token in localStorage
export const storeToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEY, token);
};

// Get the stored OAuth token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

// Remove the OAuth token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Check if the user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Initiate the OAuth login flow
export const initiateOAuthLogin = (): void => {
  const state = generateState();
  storeState(state);
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=${GITHUB_SCOPE}&state=${state}`;
  
  window.location.href = authUrl;
};

// Handle the OAuth callback with the code from GitHub
export const handleOAuthCallback = async (code: string, state: string): Promise<string> => {
  if (!verifyState(state)) {
    throw new Error("OAuth state verification failed");
  }
  
  // In a real app, this exchange should happen on the server side
  // For this frontend-only demo, we'll use a client-side approach
  // Note: GitHub doesn't allow client-side code exchange directly due to CORS,
  // so a real app would need a small server or serverless function
  // This is a simplified example for demonstration purposes
  
  // Simulated token exchange (in a real app, this would be a server call)
  // For now, we'll just use the code as a token for demonstration
  const token = code; // In reality, this would be the token received from GitHub
  
  storeToken(token);
  return token;
};

// Log out the user
export const logout = (): void => {
  removeToken();
};

// Parse the query parameters from the URL
export const parseQueryParams = (): URLSearchParams => {
  return new URLSearchParams(window.location.search);
};

// Check if the current URL contains OAuth callback parameters
export const isOAuthCallback = (): boolean => {
  const params = parseQueryParams();
  return params.has("code") && params.has("state");
};

