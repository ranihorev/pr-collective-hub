# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/857aaa6c-6240-4d8c-846a-6cd230355493

## GitHub Personal Access Token Setup

This app requires a GitHub Personal Access Token to fetch pull requests from your organization.

### Required Scopes

- **For public repositories only:** `public_repo`
- **For private repositories (recommended):** `repo` (full control of private repositories)

### How to Create a Token

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" (classic)
3. Give it a descriptive name (e.g., "PR Collective Hub")
4. Select the `repo` scope (recommended) or `public_repo` for public repos only
5. **For Enterprise Organizations:** Click "Configure SSO" next to the token after creation and authorize it for your organization
6. Click "Generate token"
7. Copy the token and paste it into the app's settings

**Note:** The token is stored locally in your browser and is never sent to any server other than GitHub's API.

### Enterprise Organization Setup

If your organization uses SAML SSO or is part of an Enterprise account:
1. After creating the token, you'll see an "Enable SSO" or "Configure SSO" button next to it
2. Click the button and authorize the token for your specific organization(s)
3. Without this authorization, the token won't have access to your organization's repositories

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/857aaa6c-6240-4d8c-846a-6cd230355493) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/857aaa6c-6240-4d8c-846a-6cd230355493) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
