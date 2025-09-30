import React, { useState, useMemo } from 'react';
import { Disc3, FolderOpen, Trash2, RefreshCw, X } from 'lucide-react';
import './Playlist.css';

const Playlist = ({ musicFiles = [], currentSongIndex = 0, onSongSelect, onDeleteTrack, onDeleteClick, onRefresh, onAlbumsClick, isAlbumMode = false, onClearAlbum }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredMusicFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return musicFiles;
    }
    
    const query = searchQuery.toLowerCase();
    return musicFiles.filter(song => 
      song.title?.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query)
    );
  }, [musicFiles, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleOpenMusicFolder = async () => {
    try {
      if (window.electronAPI && window.electronAPI.openMusicFolder) {
        const result = await window.electronAPI.openMusicFolder();
        if (result.success) {
          console.log('Music folder opened:', result.path);
        } else {
          console.error('Failed to open music folder:', result.error);
        }
      } else {
        console.error('Electron API not available');
      }
    } catch (error) {
      console.error('Error opening music folder:', error);
    }
  };

  const handleDeleteClick = (e, song, originalIndex) => {
    e.stopPropagation();
    if (onDeleteClick) {
      onDeleteClick(song, originalIndex);
    }
  };

  return (
    <aside className="playlist-sidebar">
      <h3>
        {isAlbumMode ? 'Album Playlist' : 'Playlist'}
        {isAlbumMode && <span className="album-indicator">🎵</span>}
      </h3>
      <div className="playlist-search">
        <input 
          type="text" 
          placeholder="Search songs..." 
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      <div className="playlist-items">
        {musicFiles.length === 0 ? (
          <div className="no-music">
            <p>No music files found</p>
            <p>Add music files to the Music folder</p>
          </div>
        ) : filteredMusicFiles.length === 0 ? (
          <div className="no-music">
            <p>No songs found</p>
            <p>Try a different search term</p>
          </div>
        ) : (
          filteredMusicFiles.map((song, index) => {
            const originalIndex = musicFiles.findIndex(originalSong => originalSong.id === song.id);
            return (
              <div 
                key={song.id} 
                className={`playlist-item ${originalIndex === currentSongIndex ? 'active' : ''}`}
                onClick={() => onSongSelect && onSongSelect(originalIndex)}
              >
                <div className="song-info">
                  <span className="song-title">{song.title}</span>
                  <span className="song-artist">{song.artist}</span>
                </div>
                <div className="song-actions">
                  <span className="song-duration">{formatDuration(song.duration)}</span>
                  <button 
                    className="delete-btn"
                    onClick={(e) => handleDeleteClick(e, song, originalIndex)}
                    title="Delete track"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="playlist-controls">
        <button className="control-btn" title="Refresh Playlist" onClick={onRefresh}>
          <RefreshCw size={20} />
        </button>
        <button className="control-btn" title="Albums" onClick={onAlbumsClick}>
          <Disc3 size={20} />
        </button>
        {isAlbumMode && (
          <button className="control-btn" title="Clear Album" onClick={onClearAlbum}>
            <X size={20} />
          </button>
        )}
        <button className="control-btn" title="Open Folder" onClick={handleOpenMusicFolder}>
          <FolderOpen size={20} />
        </button>
      </div>
    </aside>
  );
};

export default Playlist;
