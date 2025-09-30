import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Music, Save, FolderOpen } from 'lucide-react';
import './AlbumCreator.css';

const AlbumCreator = ({ isVisible, onClose, musicFiles, onAlbumSelect, onAlbumCreated }) => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadAlbums();
      setAvailableTracks(musicFiles);
    }
  }, [isVisible, musicFiles]);

  useEffect(() => {
    if (showSaveNotification) {
      const timer = setTimeout(() => {
        setShowSaveNotification(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSaveNotification]);

  const loadAlbums = async () => {
    try {
      if (window.electronAPI && window.electronAPI.loadAlbums) {
        const loadedAlbums = await window.electronAPI.loadAlbums();
        setAlbums(loadedAlbums || []);
      }
    } catch (error) {
      console.error('Error loading albums:', error);
      setAlbums([]);
    }
  };

  const saveAlbums = async (albumsToSave) => {
    try {
      if (window.electronAPI && window.electronAPI.saveAlbums) {
        await window.electronAPI.saveAlbums(albumsToSave);
        setAlbums(albumsToSave);
      }
    } catch (error) {
      console.error('Error saving albums:', error);
    }
  };

  const handleCreateAlbum = () => {
    if (newAlbumName.trim()) {
      const newAlbum = {
        id: Date.now().toString(),
        name: newAlbumName.trim(),
        tracks: [],
        createdAt: new Date().toISOString()
      };
      const updatedAlbums = [...albums, newAlbum];
      saveAlbums(updatedAlbums);
      setNewAlbumName('');
      setIsCreatingAlbum(false);
    }
  };

  const handleDeleteAlbum = (albumId) => {
    const updatedAlbums = albums.filter(album => album.id !== albumId);
    saveAlbums(updatedAlbums);
    if (selectedAlbum && selectedAlbum.id === albumId) {
      setSelectedAlbum(null);
    }
  };

  const handleSelectAlbum = (album) => {
    setSelectedAlbum(album);
    setSelectedTracks(album.tracks || []);
  };

  const handleAddTrack = (track) => {
    if (!selectedTracks.find(t => t.id === track.id)) {
      const updatedTracks = [...selectedTracks, track];
      setSelectedTracks(updatedTracks);
    }
  };

  const handleRemoveTrack = (trackId) => {
    const updatedTracks = selectedTracks.filter(t => t.id !== trackId);
    setSelectedTracks(updatedTracks);
  };

  const handleSaveAlbum = () => {
    if (selectedAlbum) {
      const updatedAlbums = albums.map(album => 
        album.id === selectedAlbum.id 
          ? { ...album, tracks: selectedTracks, updatedAt: new Date().toISOString() }
          : album
      );
      saveAlbums(updatedAlbums);
      setSelectedAlbum({ ...selectedAlbum, tracks: selectedTracks });
      setShowSaveNotification(true);
    }
  };

  const handleLoadAlbum = () => {
    if (selectedAlbum) {
      onAlbumSelect(selectedAlbum.tracks);
      onClose();
    }
  };

  const filteredTracks = availableTracks.filter(track => 
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTrackInAlbum = (track) => {
    return selectedTracks.some(selectedTrack => selectedTrack.id === track.id);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="album-creator-overlay">
      <div className="album-creator-popup">
        <div className="album-creator-header">
          <h2>Album Creator</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="album-creator-content">
          <div className="albums-section">
            <div className="albums-header">
              <h3>Albums</h3>
              <button 
                className="create-album-btn"
                onClick={() => setIsCreatingAlbum(true)}
              >
                <Plus size={16} />
                New Album
              </button>
            </div>

            {isCreatingAlbum && (
              <div className="create-album-form">
                <input
                  type="text"
                  placeholder="Album name..."
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateAlbum()}
                  autoFocus
                />
                <div className="form-actions">
                  <button onClick={handleCreateAlbum} disabled={!newAlbumName.trim()}>
                    Create
                  </button>
                  <button onClick={() => setIsCreatingAlbum(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="albums-list">
              {albums.map(album => (
                <div 
                  key={album.id} 
                  className={`album-item ${selectedAlbum?.id === album.id ? 'selected' : ''}`}
                  onClick={() => handleSelectAlbum(album)}
                >
                  <div className="album-info">
                    <Music size={16} />
                    <span className="album-name">{album.name}</span>
                    <span className="track-count">({album.tracks?.length || 0} tracks)</span>
                  </div>
                  <button 
                    className="delete-album-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAlbum(album.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedAlbum && (
            <div className="album-editor">
              <div className="album-editor-header">
                <h3>Edit: {selectedAlbum.name}</h3>
                <div className="album-actions">
                  <button onClick={handleSaveAlbum} className="save-btn">
                    <Save size={16} />
                    Save
                  </button>
                  <button onClick={handleLoadAlbum} className="load-btn">
                    <FolderOpen size={16} />
                    Load to Playlist
                  </button>
                </div>
              </div>
              
              {showSaveNotification && (
                <div className="save-notification">
                  <Save size={16} />
                  Album saved successfully!
                </div>
              )}

              <div className="tracks-section">
                <div className="tracks-header">
                  <h4>Selected Tracks ({selectedTracks.length})</h4>
                  <div className="search-tracks">
                    <input
                      type="text"
                      placeholder="Search tracks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="tracks-grid">
                  <div className="selected-tracks">
                    <h5>In Album</h5>
                    <div className="track-list">
                      {selectedTracks.map(track => (
                        <div key={track.id} className="track-item selected">
                          <div className="track-info">
                            <span className="track-title">{track.title}</span>
                            <span className="track-artist">{track.artist}</span>
                          </div>
                          <div className="track-actions">
                            <span className="track-duration">{formatDuration(track.duration)}</span>
                            <button 
                              onClick={() => handleRemoveTrack(track.id)}
                              className="remove-track-btn"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="available-tracks">
                    <h5>Available Tracks</h5>
                    <div className="track-list">
                      {filteredTracks.map(track => {
                        const isInAlbum = isTrackInAlbum(track);
                        return (
                          <div 
                            key={track.id} 
                            className={`track-item available ${isInAlbum ? 'already-added' : ''}`}
                            onClick={() => !isInAlbum && handleAddTrack(track)}
                          >
                            <div className="track-info">
                              <span className="track-title">{track.title}</span>
                              <span className="track-artist">{track.artist}</span>
                            </div>
                            <div className="track-actions">
                              <span className="track-duration">{formatDuration(track.duration)}</span>
                              {isInAlbum ? (
                                <span className="added-indicator">✓</span>
                              ) : (
                                <button className="add-track-btn">
                                  <Plus size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumCreator;
