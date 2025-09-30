import React, { useState, useEffect, useCallback, useRef } from 'react';
import Playlist from './components/Playlist';
import PlayerMain from './components/PlayerMain';
import SoundCloudDownloader from './components/SoundCloudDownloader';
import ConfirmationPopup from './components/ConfirmationPopup';
import AlbumCreator from './components/AlbumCreator';
import useAudio from './hooks/useAudio';
import useShuffle from './hooks/useShuffle';
import useRepeat from './hooks/useRepeat';
import useNavigation from './hooks/useNavigation';
import { scanMusicFiles } from './utils/folderUtils';
import './App.css';

function App() {
  const [musicFiles, setMusicFiles] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState(null);
  const [showAlbumCreator, setShowAlbumCreator] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);

  const handleNextRef = useRef();

  const { repeatMode, handleRepeat, loadRepeatState } = useRepeat();
  const { isShuffled, handleShuffle, getNextIndex, loadShuffleState } = useShuffle(currentPlaylist.length > 0 ? currentPlaylist : musicFiles);
  const { 
    currentSong, 
    currentSongIndex, 
    handleNext, 
    handlePrevious, 
    handleSongSelect, 
    updateCurrentSong,
    setCurrentSongIndex
  } = useNavigation(currentPlaylist.length > 0 ? currentPlaylist : musicFiles, (currentIndex) => getNextIndex(currentIndex, repeatMode));

  const {
    audioRef,
    isPlaying,
    currentTime,
    volume,
    progress,
    playPause,
    seek,
    changeVolume,
    stop,
    handleDragStart,
    handleDragEnd
  } = useAudio(currentSong, currentPlaylist.length > 0 ? currentPlaylist : musicFiles, currentSongIndex, handleNextRef, repeatMode);

  useEffect(() => {
    const loadSavedState = async () => {
      await Promise.all([
        loadShuffleState(),
        loadRepeatState()
      ]);
    };
    
    loadSavedState();
  }, [loadShuffleState, loadRepeatState]);

  useEffect(() => {
    const loadMusicFiles = async () => {
      const files = await scanMusicFiles();
      setMusicFiles(files);
    };
    
    loadMusicFiles();
  }, []);

  // Setup file system watcher for automatic playlist updates
  useEffect(() => {
    const handleMusicFilesChanged = async () => {
      console.log('Music files changed, refreshing playlist...');
      const files = await scanMusicFiles();
      setMusicFiles(files);
    };

    if (window.electronAPI && window.electronAPI.onMusicFilesChanged) {
      window.electronAPI.onMusicFilesChanged(handleMusicFilesChanged);
    }

    return () => {
      if (window.electronAPI && window.electronAPI.removeMusicFilesChangedListener) {
        window.electronAPI.removeMusicFilesChangedListener(handleMusicFilesChanged);
      }
    };
  }, []);

  useEffect(() => {
    updateCurrentSong();
  }, [musicFiles, currentPlaylist, updateCurrentSong]);

  handleNextRef.current = handleNext;


  const handleSeek = (seekTime) => {
    seek(seekTime);
  };

  const handleVolumeChange = (newVolume) => {
    changeVolume(newVolume);
  };

  const handleDownloadComplete = async (downloadResult) => {
    console.log('Download completed:', downloadResult);
    
    const wasPlaying = isPlaying;
    const currentTime = audioRef.current?.currentTime || 0;
    const currentSongId = currentSong?.id;
    
    const files = await scanMusicFiles();
    
    if (wasPlaying && currentSongId) {
      const sameSongIndex = files.findIndex(file => file.id === currentSongId);
      if (sameSongIndex !== -1) {
        setCurrentSongIndex(sameSongIndex);
      }
    }
    
    setMusicFiles(files);
    
    if (wasPlaying && currentSongId) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = currentTime;
          audioRef.current.play().catch(console.warn);
        }
      }, 150);
    }
  };

  const handleDeleteClick = (song, originalIndex) => {
    setTrackToDelete({ song, originalIndex });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (trackToDelete) {
      try {
        if (window.electronAPI && window.electronAPI.deleteTrack) {
          const result = await window.electronAPI.deleteTrack(trackToDelete.originalIndex);
          if (result.success) {
            const files = await scanMusicFiles();
            setMusicFiles(files);
            console.log('Track deleted successfully');
          } else {
            console.error('Failed to delete track:', result.error);
          }
        } else {
          console.error('Delete track API not available');
        }
      } catch (error) {
        console.error('Error deleting track:', error);
      }
    }
    setShowDeleteConfirm(false);
    setTrackToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setTrackToDelete(null);
  };

  const handleRefreshPlaylist = async () => {
    try {
      if (window.electronAPI && window.electronAPI.refreshMusicFiles) {
        const result = await window.electronAPI.refreshMusicFiles();
        if (result.success) {
          setMusicFiles(result.files);
          console.log('Playlist refreshed successfully');
        } else {
          console.error('Failed to refresh playlist:', result.error);
        }
      } else {
        // Fallback to regular scan
        const files = await scanMusicFiles();
        setMusicFiles(files);
      }
    } catch (error) {
      console.error('Error refreshing playlist:', error);
    }
  };

  const handleAlbumsClick = () => {
    setShowAlbumCreator(true);
  };

  const handleAlbumSelect = (albumTracks) => {
    setCurrentPlaylist(albumTracks);
    setCurrentSongIndex(0);
    setShowAlbumCreator(false);
  };

  const handleAlbumCreated = () => {
    // Album was created, no need to do anything special
  };

  const handleCloseAlbumCreator = () => {
    setShowAlbumCreator(false);
  };

  const handleClearAlbum = () => {
    setCurrentPlaylist([]);
    setCurrentSongIndex(0);
  };


  return (
    <div className="mp3-player">
      <audio
        ref={audioRef}
        preload="metadata"
        onError={(e) => {
          console.error('Audio error:', e);
        }}
      />
      
      <div className="player-content">
        <div className="playlist-section">
          <SoundCloudDownloader onDownloadComplete={handleDownloadComplete} />
          <Playlist 
            musicFiles={currentPlaylist.length > 0 ? currentPlaylist : musicFiles}
            currentSongIndex={currentSongIndex}
            onSongSelect={handleSongSelect}
            onDeleteClick={handleDeleteClick}
            onRefresh={handleRefreshPlaylist}
            onAlbumsClick={handleAlbumsClick}
            isAlbumMode={currentPlaylist.length > 0}
            onClearAlbum={handleClearAlbum}
          />
        </div>
        
        <PlayerMain 
          currentSong={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          totalTime={currentSong?.duration || 0}
          progress={progress}
          volume={volume}
          onPlayPause={playPause}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onShuffle={handleShuffle}
          onRepeat={handleRepeat}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          isShuffled={isShuffled}
          repeatMode={repeatMode}
        />
      </div>

      <ConfirmationPopup
        isVisible={showDeleteConfirm}
        title="Delete Track"
        message={`Are you sure you want to delete "${trackToDelete?.song?.title}"?`}
        warningText="This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <AlbumCreator
        isVisible={showAlbumCreator}
        onClose={handleCloseAlbumCreator}
        musicFiles={musicFiles}
        onAlbumSelect={handleAlbumSelect}
        onAlbumCreated={handleAlbumCreated}
      />
    </div>
  );
}

export default App;
