import { useState, useCallback } from 'react';

const useNavigation = (musicFiles, getNextIndex) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);

  const handleNext = useCallback(() => {
    if (musicFiles.length === 0) return;
    
    const newIndex = getNextIndex(currentSongIndex);
    
    if (newIndex === currentSongIndex) return;
    
    setCurrentSongIndex(newIndex);
    setCurrentSong(musicFiles[newIndex]);
  }, [musicFiles, currentSongIndex, getNextIndex]);

  const handlePrevious = useCallback(() => {
    if (musicFiles.length === 0) return;
    
    const newIndex = currentSongIndex > 0 ? currentSongIndex - 1 : musicFiles.length - 1;
    setCurrentSongIndex(newIndex);
    setCurrentSong(musicFiles[newIndex]);
  }, [musicFiles, currentSongIndex]);

  const handleSongSelect = useCallback((index) => {
    if (musicFiles.length > 0 && index >= 0 && index < musicFiles.length) {
      setCurrentSongIndex(index);
      setCurrentSong(musicFiles[index]);
    }
  }, [musicFiles]);

  const updateCurrentSong = useCallback(() => {
    if (musicFiles.length > 0 && currentSongIndex < musicFiles.length) {
      setCurrentSong(musicFiles[currentSongIndex]);
    } else if (musicFiles.length > 0) {
      setCurrentSongIndex(0);
      setCurrentSong(musicFiles[0]);
    } else {
      setCurrentSong(null);
    }
  }, [musicFiles, currentSongIndex]);

  return {
    currentSong,
    currentSongIndex,
    handleNext,
    handlePrevious,
    handleSongSelect,
    updateCurrentSong,
    setCurrentSong,
    setCurrentSongIndex
  };
};

export default useNavigation;
