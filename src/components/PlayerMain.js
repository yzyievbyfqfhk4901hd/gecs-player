import React from 'react';
import AlbumArt from './AlbumArt';
import SongInfo from './SongInfo';
import ProgressBar from './ProgressBar';
import PlayerControls from './PlayerControls';
import VolumeControl from './VolumeControl';
import './PlayerMain.css';

const PlayerMain = ({
  currentSong,
  isPlaying,
  currentTime,
  totalTime,
  progress,
  volume,
  onPlayPause,
  onPrevious,
  onNext,
  onShuffle,
  onRepeat,
  onSeek,
  onVolumeChange,
  onDragStart,
  onDragEnd,
  isShuffled,
  repeatMode
}) => {
  return (
    <main className="player-main">
      <AlbumArt 
        albumCover={currentSong?.albumCover} 
        title={currentSong?.title} 
      />
      
      <SongInfo 
        title={currentSong?.title || 'No song selected'}
        artist={currentSong?.artist || 'Unknown Artist'}
        album={currentSong?.album || 'Unknown Album'}
      />

      <ProgressBar 
        currentTime={currentTime}
        totalTime={totalTime}
        progress={progress}
        onSeek={onSeek}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />

      <PlayerControls 
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onPrevious={onPrevious}
        onNext={onNext}
        onShuffle={onShuffle}
        onRepeat={onRepeat}
        isShuffled={isShuffled}
        repeatMode={repeatMode}
      />

      <VolumeControl 
        volume={volume}
        onVolumeChange={onVolumeChange}
      />
    </main>
  );
};

export default PlayerMain;
