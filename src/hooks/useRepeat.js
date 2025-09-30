import { useState, useCallback } from 'react';
import { loadAppState, saveAppState, getDefaultState } from '../utils/stateUtils';

const useRepeat = () => {
  const [repeatMode, setRepeatMode] = useState('off');

  const handleRepeat = useCallback(async () => {
    let newRepeatMode;
    if (repeatMode === 'off') {
      newRepeatMode = 'all';
    } else if (repeatMode === 'all') {
      newRepeatMode = 'one';
    } else {
      newRepeatMode = 'off';
    }
    
    setRepeatMode(newRepeatMode);
    
    try {
      const currentState = await loadAppState() || getDefaultState();
      const updatedState = { ...currentState, repeatMode: newRepeatMode };
      await saveAppState(updatedState);
    } catch (error) {
      console.error('Error saving repeat state:', error);
    }
  }, [repeatMode]);

  const loadRepeatState = useCallback(async () => {
    try {
      const savedState = await loadAppState();
      if (savedState && savedState.repeatMode !== undefined) {
        setRepeatMode(savedState.repeatMode);
      }
    } catch (error) {
      console.error('Error loading repeat state:', error);
    }
  }, []);

  return {
    repeatMode,
    handleRepeat,
    loadRepeatState
  };
};

export default useRepeat;
