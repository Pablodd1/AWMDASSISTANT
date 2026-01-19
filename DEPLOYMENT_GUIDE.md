# GitHub Deployment Guide - American Wellness MD Assistant

## Prerequisites Check
✅ All code files ready
✅ README.md created
✅ .gitignore configured

## Step-by-Step Deployment Instructions

### Step 1: Install Git (if needed)
If you don't have Git installed:
1. Download from: https://git-scm.com/download/win
2. Run the installer with default settings
3. Restart your terminal/PowerShell

### Step 2: Configure Git (First Time Only)
Open PowerShell or Command Prompt and run:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Navigate to Project Directory
```bash
cd C:\Users\horac\.gemini\antigravity\scratch\medical-doc-analyzer
```

### Step 4: Initialize Git Repository
```bash
git init
```

### Step 5: Add All Files
```bash
git add .
```

### Step 6: Create Initial Commit
```bash
git commit -m "Initial commit: American Wellness MD Assistant v2.0 - Comprehensive medical intelligence platform with personalized recommendations, enhanced chatbot, and minimalist UI"
```

### Step 7: Add Remote Repository
```bash
git remote add origin https://github.com/Pablodd1/AWMDASSISTANT.git
```

### Step 8: Set Main Branch
```bash
git branch -M main
```

### Step 9: Push to GitHub
```bash
git push -u origin main
```

## Troubleshooting

### If you get "repository not found" error:
1. Make sure the repository exists at https://github.com/Pablodd1/AWMDASSISTANT
2. Verify you have write access to the repository
3. You may need to authenticate with GitHub (username/password or personal access token)

### If you need to authenticate:
GitHub may prompt you to log in. Use your GitHub username and a **Personal Access Token** (not your password):
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with "repo" permissions
3. Use this token as your password when prompted

### If the repository already has content:
If you need to force push (⚠️ this will overwrite remote content):
```bash
git push -u origin main --force
```

## Verification

After pushing, verify your deployment:
1. Visit: https://github.com/Pablodd1/AWMDASSISTANT
2. Check that all files are present:
   - index.html
   - styles.css
   - app.js
   - README.md
   - .gitignore
3. Verify the README displays correctly

## Quick Copy-Paste Commands (All Steps)

```bash
cd C:\Users\horac\.gemini\antigravity\scratch\medical-doc-analyzer
git init
git add .
git commit -m "Initial commit: American Wellness MD Assistant v2.0"
git remote add origin https://github.com/Pablodd1/AWMDASSISTANT.git
git branch -M main
git push -u origin main
```

---

**Note**: If Git is not installed, you'll need to install it first from https://git-scm.com/download/win
