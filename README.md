# Multi Git Repo Manager

A lightweight desktop application for managing multiple Git repositories at once.  
Perfect for developers working with monorepos or multiple separate projects who want to **checkout different branches** or **pull the latest changes** across many repos with just a few clicks.

## Key Features

- Scans a root folder and all subfolders to detect Git repositories (those containing a `.git` folder).
- Displays a list of repositories with:
  - Folder name (with full path shown below).
  - Current branch.
  - Individual **Target Branch** dropdown for each repo (shows all local + remote branches).
  - Checkboxes for **Checkout** (enabled by default) and **Pull after checkout**.
- Select multiple repositories using checkboxes.
- Click **RUN OPERATIONS** to:
  - Checkout to the selected branch (automatically creates and tracks a new local branch if it only exists remotely).
  - Pull the latest changes if "Pull after" is checked.
- Detailed success/error results shown after execution.
- Simple, clean interface – no terminal required.

## System Requirements

- Windows 10/11 (tested on Windows 11)
- macOS support coming soon

## Installation

1. Download the latest installer from the [Releases](https://github.com/dtha1002/multi-git-manager/releases) page  
   (e.g., `git-manager Setup x.x.x.exe`)
2. Run the .exe file and follow the standard installation steps.
3. Launch **Multi Git Repo Manager** from the Start menu or desktop shortcut.

## Usage

1. Click **Browse** or manually enter the path to the folder containing your Git projects.
2. Click **Scan Repos** – the list of detected repositories will appear.
3. Check the boxes in the first column to select the repositories you want to operate on (multiple selection supported).
4. For each repository:
   - Choose the desired target branch from the **Target Branch** dropdown (each repo can have a different branch).
   - Enable/disable **Checkout** and **Pull after** as needed.
5. Click **RUN OPERATIONS ON SELECTED REPOS** – the app will perform the actions.
6. Results (success or errors) will be shown in a popup. You can re-scan to refresh the current branch display.

## Building from Source

Requirements:
- Node.js (recommended v20+)
- Docker (for building Windows executable from Linux/WSL)

```bash
# Clone the repository
git clone https://github.com/dtha1002/multi-git-manager.git
cd multi-git-manager

# Build Windows executable
docker run --rm -ti \
  -v "$(pwd)":/project \
  -v "$(pwd)/dist":/project/dist \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine-mono \
  /bin/bash -c "npm install && npx electron-builder --win"
```

Output files will be placed in the dist folder.

## Technologies Used
- Electron.js
- simple-git
- Pure HTML/CSS/JavaScript (no heavy frameworks)

## Acknowledgments
Thank you for using the app!
If you find it helpful, please give it a ⭐ on GitHub ❤️
Feel free to open an Issue or Pull Request for bugs, feature requests (e.g., auto-stash, repo status display, macOS build), or improvements.
Happy coding! 🚀
