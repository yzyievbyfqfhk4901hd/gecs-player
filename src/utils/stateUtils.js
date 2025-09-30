const STATE_FILE_NAME = 'app-state.json';

export const saveAppState = async (state) => {
  try {
    if (window.electronAPI && window.electronAPI.saveAppState) {
      await window.electronAPI.saveAppState(STATE_FILE_NAME, state);
      console.log('App state saved successfully');
    } else {
      localStorage.setItem('appState', JSON.stringify(state));
      console.log('App state saved to localStorage');
    }
  } catch (error) {
    console.error('Error saving app state:', error);
  }
};

export const loadAppState = async () => {
  try {
    if (window.electronAPI && window.electronAPI.loadAppState) {
      const state = await window.electronAPI.loadAppState(STATE_FILE_NAME);
      console.log('App state loaded successfully:', state);
      return state;
    } else {
      const state = localStorage.getItem('appState');
      console.log('App state loaded from localStorage:', state);
      return state ? JSON.parse(state) : null;
    }
  } catch (error) {
    console.error('Error loading app state:', error);
    return null;
  }
};

export const getDefaultState = () => ({
  volume: 70,
  shuffle: false,
  repeatMode: 'off'
});
