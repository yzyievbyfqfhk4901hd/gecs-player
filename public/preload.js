const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
  getFolderPaths: () => ipcRenderer.invoke('get-folder-paths'),
  scanMusicFiles: () => ipcRenderer.invoke('scan-music-files'),
  getAudioFileUrl: (filePath) => ipcRenderer.invoke('get-audio-file-url', filePath),
  saveAppState: (fileName, state) => ipcRenderer.invoke('save-app-state', fileName, state),
  loadAppState: (fileName) => ipcRenderer.invoke('load-app-state', fileName),
  downloadSoundCloudTrack: (url) => ipcRenderer.invoke('download-soundcloud-track', url),
  getSoundCloudTrackInfo: (url) => ipcRenderer.invoke('get-soundcloud-track-info', url),
  validateSoundCloudUrl: (url) => ipcRenderer.invoke('validate-soundcloud-url', url),
  openMusicFolder: () => ipcRenderer.invoke('open-music-folder'),
  deleteTrack: (trackIndex) => ipcRenderer.invoke('delete-track', trackIndex),
  refreshMusicFiles: () => ipcRenderer.invoke('refresh-music-files'),
  saveAlbums: (albums) => ipcRenderer.invoke('save-albums', albums),
  loadAlbums: () => ipcRenderer.invoke('load-albums'),
  onMusicFilesChanged: (callback) => ipcRenderer.on('music-files-changed', callback),
  removeMusicFilesChangedListener: (callback) => ipcRenderer.removeListener('music-files-changed', callback),
});
