const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  browsePath: () => ipcRenderer.invoke('browse-path'),
  scanRepos: (path) => ipcRenderer.invoke('scan-repos', path),
  checkoutBranch: (repoPath, branch) => ipcRenderer.invoke('checkout-branch', repoPath, branch),
  pullRepo: (repoPath) => ipcRenderer.invoke('pull-repo', repoPath)
});

console.log('Preload loaded successfully');