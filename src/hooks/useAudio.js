import { useState, useEffect, useRef, useCallback } from 'react';
import { getAudioFileUrl } from '../utils/folderUtils';
import { loadAppState, saveAppState, getDefaultState } from '../utils/stateUtils';

const percentageToAmplitude = (percentage) => {
  if (percentage === 0) return 0;
  
  const minDb = -60;
  const maxDb = 0;
  const db = minDb + (percentage / 100) * (maxDb - minDb);
  
  return Math.pow(10, db / 20);
};


const useAudio = (currentSong, musicFiles, currentSongIndex, onNextRef, repeatMode) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  
  const audioRef = useRef(null);
  const isInitialLoad = useRef(true);
  const hasLoadedState = useRef(false);

  useEffect(() => {
    const loadSavedState = async () => {
      if (hasLoadedState.current) return;
      
      try {
        const savedState = await loadAppState();
        if (savedState && savedState.volume !== undefined) {
          setVolume(savedState.volume);
          console.log('Loaded saved volume:', savedState.volume);
        }
        hasLoadedState.current = true;
      } catch (error) {
        console.error('Error loading saved state:', error);
        hasLoadedState.current = true;
      }
    };
    
    loadSavedState();
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio && currentSong) {
      if (currentSong.duration === 0 || !currentSong.duration) {
        console.log('Audio duration loaded:', audio.duration);
      }
    }
  }, [currentSong]);

  const handleEnded = useCallback(() => {
    console.log('Song ended');
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
      }
    } else if (onNextRef && onNextRef.current) {
      onNextRef.current();
    }
  }, [onNextRef, repeatMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const loadAudioFile = async () => {
      try {
        console.log('Loading audio file:', currentSong.filePath);
        
        const fileUrl = await getAudioFileUrl(currentSong.filePath);
        
        if (fileUrl) {
          console.log('Using file URL:', fileUrl);
          audio.src = fileUrl;
          audio.load();
          
          const handleCanPlay = () => {
            if (!isInitialLoad.current) {
              audio.play().then(() => {
                setIsPlaying(true);
              }).catch((error) => {
                console.warn('Autoplay failed:', error);
              });
            } else {
              isInitialLoad.current = false;
            }
            audio.removeEventListener('canplay', handleCanPlay);
          };
          
          audio.addEventListener('canplay', handleCanPlay);
        } else {
          console.error('Failed to get file URL for:', currentSong.filePath);
        }
        
      } catch (error) {
        console.error('Error loading audio file:', error);
      }
    };
    
    loadAudioFile();
    setCurrentTime(0);
  }, [currentSong?.filePath]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = percentageToAmplitude(volume);
    }
  }, [volume]);

  const playPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seek = useCallback((seekTime) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  }, []);

  const changeVolume = useCallback(async (newVolume) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = percentageToAmplitude(newVolume);
    setVolume(newVolume);
    
    try {
      const currentState = await loadAppState() || getDefaultState();
      const updatedState = { ...currentState, volume: newVolume };
      await saveAppState(updatedState);
    } catch (error) {
      console.error('Error saving volume state:', error);
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.play();
    setIsPlaying(true);
  }, []);

  const handleDragStart = useCallback(() => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      pause();
    }
    return wasPlaying;
  }, [isPlaying, pause]);

  const handleDragEnd = useCallback(() => {
    resume();
  }, [resume]);

  const progress = currentSong && currentSong.duration > 0 ? (currentTime / currentSong.duration) * 100 : 0;

  return {
    audioRef,
    isPlaying,
    currentTime,
    volume,
    progress,
    playPause,
    seek,
    changeVolume,
    stop,
    pause,
    resume,
    handleDragStart,
    handleDragEnd
  };
};

export default useAudio;
