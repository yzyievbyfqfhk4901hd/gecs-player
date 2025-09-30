const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const isDev = require('electron-is-dev');
const { parseFile } = require('music-metadata');
const { spawn } = require('child_process');

let mainWindow;
let folderPaths = null;
let musicWatcher = null;
let isActuallyDev = false;

function createGecsPlayerFolders() {
  let basePath;
  
  if (process.platform === 'win32') {
    basePath = path.join(os.homedir(), 'Documents', 'GecsPlayer');
  } else if (process.platform === 'darwin') {
    basePath = path.join(os.homedir(), 'Documents', 'GecsPlayer');
  } else {
    basePath = path.join(os.homedir(), 'Documents', 'GecsPlayer');
  }
  
  const musicPath = path.join(basePath, 'Music');
  
  try {
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
      console.log('Created GecsPlayer folder at:', basePath);
    }
    
    if (!fs.existsSync(musicPath)) {
      fs.mkdirSync(musicPath, { recursive: true });
      console.log('Created Music folder at:', musicPath);
    }
    
    return {
      gecsPlayerPath: basePath,
      musicPath: musicPath
    };
  } catch (error) {
    console.error('Error creating GecsPlayer folders:', error);
    return null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
    icon: path.join(__dirname, 'favicon.ico'),
  });

  console.log('isDev:', isDev);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('__dirname:', __dirname);
  console.log('process.resourcesPath:', process.resourcesPath);

  const buildPath = path.join(__dirname, '../build/index.html');
  const hasBuildFiles = fs.existsSync(buildPath);
  
  isActuallyDev = (isDev || process.env.NODE_ENV === 'development') && !hasBuildFiles;
  console.log('isActuallyDev:', isActuallyDev);
  console.log('hasBuildFiles:', hasBuildFiles);

  let startUrl;
  if (isActuallyDev) {
    startUrl = 'http://localhost:3000';
    console.log('Running in development mode');
  } else {
    console.log('Running in production mode');
    const possiblePaths = [
      path.join(__dirname, '../build/index.html'),
      path.join(__dirname, 'build/index.html'),
      path.join(process.resourcesPath, 'app/build/index.html'),
      path.join(process.resourcesPath, 'app.asar/build/index.html')
    ];
    
    let foundPath = null;
    for (const possiblePath of possiblePaths) {
      console.log('Checking path:', possiblePath, 'exists:', fs.existsSync(possiblePath));
      if (fs.existsSync(possiblePath)) {
        foundPath = possiblePath;
        console.log('Found React app at:', possiblePath);
        break;
      }
    }
    
    if (foundPath) {
      startUrl = `file://${foundPath}`;
    } else {
      console.error('Could not find React app build files. Tried paths:', possiblePaths);
      startUrl = 'data:text/html,<h1>Error: React app not found</h1><p>Build files are missing.</p>';
    }
  }
  
  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);


  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('get-folder-paths', () => {
  return folderPaths;
});

async function scanMusicFiles() {
  if (!folderPaths) {
    return [];
  }
  
  const musicPath = folderPaths.musicPath;
  const supportedFormats = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma'];
  const musicFiles = [];
  
  try {
    async function scanDirectory(dirPath) {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (supportedFormats.includes(ext)) {
            const relativePath = path.relative(musicPath, fullPath);
            
            let metadata = {
              title: path.basename(item, ext),
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: 0,
              albumCover: null
            };
            
            try {
              const audioMetadata = await parseFile(fullPath);
              
              if (audioMetadata.common.title) {
                metadata.title = audioMetadata.common.title;
              }
              if (audioMetadata.common.artist) {
                metadata.artist = audioMetadata.common.artist;
              }
              if (audioMetadata.common.album) {
                metadata.album = audioMetadata.common.album;
              }
              
              if (audioMetadata.format.duration) {
                metadata.duration = audioMetadata.format.duration;
              }
              
              if (audioMetadata.common.picture && audioMetadata.common.picture.length > 0) {
                const picture = audioMetadata.common.picture[0];
                console.log(`Album art found for ${item}: format=${picture.format}, size=${picture.data.length} bytes`);
                
                let imageBuffer;
                if (Buffer.isBuffer(picture.data)) {
                  imageBuffer = picture.data;
                } else if (picture.data instanceof Uint8Array) {
                  imageBuffer = Buffer.from(picture.data);
                } else {
                  console.warn(`Unexpected data type for album art: ${typeof picture.data}`);
                  imageBuffer = Buffer.from(picture.data);
                }
                
                const base64Data = imageBuffer.toString('base64');
                console.log(`Base64 data length: ${base64Data.length}, first 50 chars: ${base64Data.substring(0, 50)}`);
                
                let mimeType = 'image/jpeg';
                switch (picture.format) {
                  case 'image/jpeg':
                  case 'image/jpg':
                    mimeType = 'image/jpeg';
                    break;
                  case 'image/png':
                    mimeType = 'image/png';
                    break;
                  case 'image/gif':
                    mimeType = 'image/gif';
                    break;
                  case 'image/bmp':
                    mimeType = 'image/bmp';
                    break;
                  case 'image/webp':
                    mimeType = 'image/webp';
                    break;
                  default:
                    if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
                      mimeType = 'image/jpeg';
                    } else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
                      mimeType = 'image/png';
                    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
                      mimeType = 'image/gif';
                    }
                    console.log(`Detected MIME type: ${mimeType} for format: ${picture.format}`);
                }
                
                metadata.albumCover = `data:${mimeType};base64,${base64Data}`;
                console.log(`Created data URL: data:${mimeType};base64,${base64Data.substring(0, 50)}...`);
              } else {
                console.log(`No album art found for ${item}`);
              }
              
            } catch (metadataError) {
              console.warn(`Could not extract metadata from ${fullPath}:`, metadataError.message);
            }
            
            const filePathHash = crypto.createHash('md5').update(fullPath).digest('hex').substring(0, 8);
            
            musicFiles.push({
              id: filePathHash,
              ...metadata,
              filePath: fullPath,
              relativePath: relativePath
            });
          }
        }
      }
    }
    
    if (fs.existsSync(musicPath)) {
      await scanDirectory(musicPath);
    }
    
    console.log(`Found ${musicFiles.length} music files`);
    return musicFiles;
  } catch (error) {
    console.error('Error scanning music files:', error);
    return [];
  }
}

ipcMain.handle('scan-music-files', async () => {
  return await scanMusicFiles();
});

function setupMusicWatcher() {
  if (!folderPaths || !folderPaths.musicPath) {
    console.log('Cannot setup music watcher: folder paths not available');
    return;
  }

  if (musicWatcher) {
    musicWatcher.close();
    musicWatcher = null;
  }

  try {
    musicWatcher = fs.watch(folderPaths.musicPath, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.endsWith('.mp3') || filename.endsWith('.wav') || filename.endsWith('.flac') || 
          filename.endsWith('.m4a') || filename.endsWith('.aac') || filename.endsWith('.ogg') || filename.endsWith('.wma'))) {
        console.log('Music file change detected:', eventType, filename);
        
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('music-files-changed');
        }
      }
    });
    
    console.log('Music directory watcher setup for:', folderPaths.musicPath);
  } catch (error) {
    console.error('Error setting up music watcher:', error);
  }
}

ipcMain.handle('refresh-music-files', async () => {
  try {
    const files = await scanMusicFiles();
    return { success: true, files };
  } catch (error) {
    console.error('Error refreshing music files:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-audio-file-url', (event, filePath) => {
  try {
    const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
    let fileUrl;
    
    if (process.platform === 'win32') {
      // Windows: file:///C:/path/to/file
      const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
      fileUrl = `file:///${cleanPath}`;
    } else {
      // Unix-like systems: file:///path/to/file
      fileUrl = `file://${normalizedPath}`;
    }
    
    fileUrl = encodeURI(fileUrl);
    
    console.log('Original file path:', filePath);
    console.log('Normalized path:', normalizedPath);
    console.log('Generated file URL:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Error generating file URL:', error);
    return null;
  }
});

ipcMain.handle('save-app-state', async (event, fileName, state) => {
  try {
    if (!folderPaths) {
      console.error('Folder paths not initialized');
      return false;
    }
    
    const stateFilePath = path.join(folderPaths.gecsPlayerPath, fileName);
    const stateData = JSON.stringify(state, null, 2);
    
    fs.writeFileSync(stateFilePath, stateData, 'utf8');
    console.log('App state saved to:', stateFilePath);
    return true;
  } catch (error) {
    console.error('Error saving app state:', error);
    return false;
  }
});

ipcMain.handle('load-app-state', async (event, fileName) => {
  try {
    if (!folderPaths) {
      console.error('Folder paths not initialized');
      return null;
    }
    
    const stateFilePath = path.join(folderPaths.gecsPlayerPath, fileName);
    
    if (!fs.existsSync(stateFilePath)) {
      console.log('State file does not exist:', stateFilePath);
      return null;
    }
    
    const stateData = fs.readFileSync(stateFilePath, 'utf8');
    const state = JSON.parse(stateData);
    console.log('App state loaded from:', stateFilePath);
    return state;
  } catch (error) {
    console.error('Error loading app state:', error);
    return null;
  }
});

ipcMain.handle('download-soundcloud-track', async (event, url) => {
  try {
    if (!folderPaths) {
      folderPaths = createGecsPlayerFolders();
    }
    
    const musicPath = folderPaths.musicPath;
    
    let pythonExecutablePath;
    
    if (isActuallyDev) {
      if (process.platform === 'win32') {
        pythonExecutablePath = path.join(__dirname, '..', 'dist', 'python_downloader.exe');
      } else {
        pythonExecutablePath = path.join(__dirname, '..', 'dist', 'python_downloader');
      }
    } else {
      const possiblePaths = [];
      
      if (process.platform === 'win32') {
        possiblePaths.push(
          path.join(process.resourcesPath, 'python_downloader.exe'),
          path.join(process.resourcesPath, 'dist', 'python_downloader.exe'),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'python_downloader.exe'),
          path.join(__dirname, '..', 'dist', 'python_downloader.exe'),
          path.join(__dirname, 'dist', 'python_downloader.exe')
        );
      } else {
        possiblePaths.push(
          path.join(process.resourcesPath, 'python_downloader'),
          path.join(process.resourcesPath, 'dist', 'python_downloader'),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'python_downloader'),
          path.join(__dirname, '..', 'dist', 'python_downloader'),
          path.join(__dirname, 'dist', 'python_downloader')
        );
      }
      
      let foundPath = null;
      for (const possiblePath of possiblePaths) {
        console.log('Checking Python executable path:', possiblePath, 'exists:', fs.existsSync(possiblePath));
        if (fs.existsSync(possiblePath)) {
          if (process.platform !== 'win32') {
            try {
              fs.accessSync(possiblePath, fs.constants.X_OK);
            } catch (err) {
              console.warn('Python executable found but not executable:', possiblePath);
              try {
                const { execSync } = require('child_process');
                execSync(`chmod +x "${possiblePath}"`);
                console.log('Made Python executable executable:', possiblePath);
              } catch (chmodErr) {
                console.warn('Could not make Python executable executable:', chmodErr.message);
                continue;
              }
            }
          }
          foundPath = possiblePath;
          console.log('Found Python executable at:', possiblePath);
          break;
        }
      }
      
      pythonExecutablePath = foundPath;
    }
    
    if (!pythonExecutablePath || !fs.existsSync(pythonExecutablePath)) {
      console.error('Python executable not found in any of the expected locations');
      console.error('Searched paths:', possiblePaths || 'Not available');
      return {
        success: false,
        error: 'Python downloader executable not found. Please rebuild the application with the Python downloader included.'
      };
    }
    
    console.log('Starting download for:', url);
    console.log('Python executable path:', pythonExecutablePath);
    console.log('Python executable exists:', fs.existsSync(pythonExecutablePath));
    console.log('Python executable directory:', path.dirname(pythonExecutablePath));
    console.log('Music path:', musicPath);
    
    return new Promise((resolve, reject) => {
      const isExecutable = pythonExecutablePath.endsWith('.exe') || !pythonExecutablePath.endsWith('.py');
      const command = isExecutable ? pythonExecutablePath : 'python';
      const args = isExecutable ? [url] : [pythonExecutablePath, url];
      
      const pythonDir = path.dirname(pythonExecutablePath);
      
      const pythonProcess = spawn(command, args, {
        cwd: pythonDir,
        env: { ...process.env, DOWNLOADS_DIR: musicPath }
      });
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        console.log('Python process exited with code:', code);
        console.log('Output:', output);
        console.log('Error output:', errorOutput);
        
        if (code === 0) {
          try {
            const cleanOutput = output.trim();
            const lastBrace = cleanOutput.lastIndexOf('}');
            const firstBrace = cleanOutput.indexOf('{');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              const jsonOutput = cleanOutput.substring(firstBrace, lastBrace + 1);
              const result = JSON.parse(jsonOutput);
              resolve(result);
            } else {
              throw new Error('No valid JSON found in output');
            }
          } catch (parseError) {
            console.error('Error parsing Python output:', parseError);
            console.error('Raw output:', output);
            resolve({
              success: false,
              error: 'Failed to parse download result: ' + parseError.message
            });
          }
        } else {
          console.error('Python process error:', errorOutput);
          resolve({
            success: false,
            error: errorOutput || 'Download failed'
          });
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        console.error('Command:', command);
        console.error('Args:', args);
        console.error('Working directory:', pythonDir);
        resolve({
          success: false,
          error: `Failed to start download process: ${error.message}`
        });
      });
    });
    
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('get-soundcloud-track-info', async (event, url) => {
  return {
    success: true,
    trackInfo: { title: 'Track info will be available after download' }
  };
});

ipcMain.handle('validate-soundcloud-url', (event, url) => {
  const soundcloudDomains = [
    'soundcloud.com', 'm.soundcloud.com'
  ];
  
  const urlLower = url.toLowerCase().trim();
  
  for (const domain of soundcloudDomains) {
    if (urlLower.includes(domain)) {
      return true;
    }
  }
  
  return false;
});

ipcMain.handle('open-music-folder', async () => {
  try {
    if (!folderPaths) {
      folderPaths = createGecsPlayerFolders();
    }
    
    if (folderPaths && folderPaths.musicPath) {
      await shell.openPath(folderPaths.musicPath);
      return { success: true, path: folderPaths.musicPath };
    } else {
      return { success: false, error: 'Music folder not found' };
    }
  } catch (error) {
    console.error('Error opening music folder:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-track', async (event, trackIndex) => {
  try {
    if (!folderPaths) {
      folderPaths = createGecsPlayerFolders();
    }
    
    if (!folderPaths || !folderPaths.musicPath) {
      return { success: false, error: 'Music folder not found' };
    }

    const musicFiles = await scanMusicFiles();
    if (trackIndex < 0 || trackIndex >= musicFiles.length) {
      return { success: false, error: 'Invalid track index' };
    }

    const trackToDelete = musicFiles[trackIndex];
    const filePath = trackToDelete.filePath;

    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    fs.unlinkSync(filePath);
    
    console.log('Deleted track:', filePath);
    return { success: true, deletedFile: filePath };
  } catch (error) {
    console.error('Error deleting track:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-albums', async (event, albums) => {
  try {
    if (!folderPaths) {
      folderPaths = createGecsPlayerFolders();
    }
    
    if (!folderPaths || !folderPaths.gecsPlayerPath) {
      return { success: false, error: 'GecsPlayer folder not found' };
    }

    const albumsPath = path.join(folderPaths.gecsPlayerPath, 'albums.json');
    fs.writeFileSync(albumsPath, JSON.stringify(albums, null, 2));
    
    console.log('Albums saved to:', albumsPath);
    return { success: true };
  } catch (error) {
    console.error('Error saving albums:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-albums', async () => {
  try {
    if (!folderPaths) {
      folderPaths = createGecsPlayerFolders();
    }
    
    if (!folderPaths || !folderPaths.gecsPlayerPath) {
      return [];
    }

    const albumsPath = path.join(folderPaths.gecsPlayerPath, 'albums.json');
    
    if (!fs.existsSync(albumsPath)) {
      return [];
    }

    const albumsData = fs.readFileSync(albumsPath, 'utf8');
    const albums = JSON.parse(albumsData);
    
    console.log('Albums loaded from:', albumsPath);
    return albums;
  } catch (error) {
    console.error('Error loading albums:', error);
    return [];
  }
});

app.whenReady().then(() => {
  folderPaths = createGecsPlayerFolders();
  if (folderPaths) {
    console.log('GecsPlayer folders ready:');
    console.log('  GecsPlayer path:', folderPaths.gecsPlayerPath);
    console.log('  Music path:', folderPaths.musicPath);
    
    setupMusicWatcher();
  }
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (musicWatcher) {
    musicWatcher.close();
    musicWatcher = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
