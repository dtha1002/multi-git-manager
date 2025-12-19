const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const git = require('simple-git');
const fs = require('fs');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('browse-path', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths[0];
});

ipcMain.handle('scan-repos', async (event, rootPath) => {
  const repos = [];

  // Asynchronous walk folder
  async function walk(dir) {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.promises.stat(fullPath);
      if (stat.isDirectory()) {
        if (file === '.git') {
          repos.push(path.dirname(fullPath));
        } else {
          await walk(fullPath);
        }
      }
    }
  }

  try {
    await walk(rootPath);
  } catch (err) {
    console.error('Walk error:', err);
    return [];
  }

  const batchSize = 10;
  const repoDetails = [];
  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const promises = batch.map(async (repoPath) => {
      const repo = git(repoPath);
      try {
        const branchSummary = await repo.branch(['-a']);
        const current = branchSummary.current || '(detached)';

        const localBranches = Object.keys(branchSummary.branches);

        const remoteBranches = branchSummary.all
          .filter(b => b.startsWith('remotes/origin/') && !b.includes('HEAD'))
          .map(b => b.replace('remotes/origin/', ''));

        const allBranches = Array.from(new Set([...localBranches, ...remoteBranches])).sort();

        return {
          path: repoPath,
          current,
          branches: allBranches
        };
      } catch (err) {
        return {
          path: repoPath,
          current: '(error)',
          branches: []
        };
      }
    });

    const results = await Promise.all(promises);
    repoDetails.push(...results);
  }

  return repoDetails;
});

ipcMain.handle('checkout-branch', async (event, repoPath, branch) => {
  const repo = git(repoPath);
  try {
    await repo.fetch();
    if (branch in (await repo.branchLocal()).all) {
      await repo.checkout(branch);
    } else {
      await repo.checkoutBranch(branch, `origin/${branch}`);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('pull-repo', async (event, repoPath) => {
  const repo = git(repoPath);
  try {
    await repo.pull();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});