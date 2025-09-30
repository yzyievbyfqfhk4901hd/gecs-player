import { useState, useCallback } from 'react';
import { loadAppState, saveAppState, getDefaultState } from '../utils/stateUtils';

const useShuffle = (musicFiles) => {
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState([]);

  const handleShuffle = useCallback(async () => {
    const newShuffleState = !isShuffled;
    
    if (newShuffleState) {
      const indices = Array.from({ length: musicFiles.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    } else {
      setShuffledIndices([]);
    }
    
    setIsShuffled(newShuffleState);
    
    try {
      const currentState = await loadAppState() || getDefaultState();
      const updatedState = { ...currentState, shuffle: newShuffleState };
      await saveAppState(updatedState);
    } catch (error) {
      console.error('Error saving shuffle state:', error);
    }
  }, [isShuffled, musicFiles.length]);

  const getNextIndex = useCallback((currentIndex, repeatMode) => {
    if (musicFiles.length === 0) return currentIndex;
    
    if (isShuffled && shuffledIndices.length > 0) {
      const currentShuffledIndex = shuffledIndices.indexOf(currentIndex);
      if (currentShuffledIndex !== -1 && currentShuffledIndex < shuffledIndices.length - 1) {
        return shuffledIndices[currentShuffledIndex + 1];
      } else {
        const indices = Array.from({ length: musicFiles.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setShuffledIndices(indices);
        return indices[0];
      }
    } else {
      if (currentIndex < musicFiles.length - 1) {
        return currentIndex + 1;
      } else {
        return 0;
      }
    }
  }, [isShuffled, shuffledIndices, musicFiles.length]);

  const loadShuffleState = useCallback(async () => {
    try {
      const savedState = await loadAppState();
      if (savedState && savedState.shuffle !== undefined) {
        setIsShuffled(savedState.shuffle);
      }
    } catch (error) {
      console.error('Error loading shuffle state:', error);
    }
  }, []);

  return {
    isShuffled,
    shuffledIndices,
    handleShuffle,
    getNextIndex,
    loadShuffleState
  };
};

export default useShuffle;
