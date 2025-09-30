import React from 'react';
import './SongInfo.css';

const SongInfo = ({ title, artist, album }) => {
  return (
    <div className="song-info">
      <h2 className="song-title">{title}</h2>
      <p className="artist-name">{artist}</p>
      <p className="album-name">{album}</p>
    </div>
  );
};

export default SongInfo;
