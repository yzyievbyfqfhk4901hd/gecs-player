export const getFolderPaths = async () => {
  try {
    if (window.electronAPI) {
      return await window.electronAPI.getFolderPaths();
    }
    return null;
  } catch (error) {
    console.error('Error getting folder paths:', error);
    return null;
  }
};

export const getMusicFolderPath = async () => {
  const paths = await getFolderPaths();
  return paths ? paths.musicPath : null;
};

export const getGecsPlayerFolderPath = async () => {
  const paths = await getFolderPaths();
  return paths ? paths.gecsPlayerPath : null;
};

export const scanMusicFiles = async () => {
  try {
    if (window.electronAPI) {
      return await window.electronAPI.scanMusicFiles();
    }
    return [];
  } catch (error) {
    console.error('Error scanning music files:', error);
    return [];
  }
};

export const getAudioFileUrl = async (filePath) => {
  try {
    if (window.electronAPI) {
      return await window.electronAPI.getAudioFileUrl(filePath);
    }
    return null;
  } catch (error) {
    console.error('Error getting audio file URL:', error);
    return null;
  }
};
