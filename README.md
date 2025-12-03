# tonicthoughtstudios.com

## Security & Environment Variables

**Important:** Never commit sensitive credentials (API tokens, passwords, keys) to version control.

### Setting up environment variables:

1. Create a `.env` file in the project root (this file is gitignored)
2. Add your credentials as environment variables using generic, non-descriptive names
3. Load these variables in your application code using your framework's environment variable system
4. **Never** document specific credential variable names in version control, as this creates reconnaissance information for attackers

### If credentials were accidentally committed:

If sensitive data was committed to git history, you must:
1. Rotate/regenerate all exposed credentials immediately
2. Remove the file from git history using `git filter-branch` or BFG Repo-Cleaner
3. Force push to update the remote repository (coordinate with your team first)