# Agent Behavioral Rules

- **Git Commits**: DO NOT automatically commit and push changes to Git. Only commit and push changes when the user explicitly requests it.
- **Pre-Commit Safeguards**: Before committing any files, thoroughly check the `git status` output. Ensure no sensitive files (e.g., `.env`, API keys, certificates) or unwanted scratch files (e.g., load tests, temporary data) are staged. If a sensitive file is tracked, untrack it using `git rm --cached <file>` and add it to `.gitignore`. Delete or `.gitignore` any unwanted files.
