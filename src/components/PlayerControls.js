import React from 'react';
import { SkipBack, Play, Pause, SkipForward, Shuffle, Repeat } from 'lucide-react';
import './PlayerControls.css';

const PlayerControls = ({ 
  isPlaying, 
  onPlayPause, 
  onPrevious, 
  onNext, 
  onShuffle, 
  onRepeat,
  isShuffled,
  repeatMode
}) => {
  return (
    <div className="player-controls">
      <button className="control-btn" onClick={onPrevious}>
        <SkipBack size={20} />
      </button>
      <button className="control-btn play-btn" onClick={onPlayPause}>
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>
      <button className="control-btn" onClick={onNext}>
        <SkipForward size={20} />
      </button>
      <button 
        className={`control-btn ${isShuffled ? 'active' : ''}`} 
        onClick={onShuffle}
        title={isShuffled ? 'Shuffle On' : 'Shuffle Off'}
      >
        <Shuffle size={20} />
      </button>
      <button 
        className={`control-btn ${repeatMode !== 'off' ? 'active' : ''}`} 
        onClick={onRepeat}
        title={
          repeatMode === 'off' ? 'Repeat Off' : 
          repeatMode === 'all' ? 'Repeat All' : 
          'Repeat One'
        }
      >
        <Repeat size={20} />
        {repeatMode === 'one' && <span className="repeat-indicator">1</span>}
      </button>
    </div>
  );
};

export default PlayerControls;
