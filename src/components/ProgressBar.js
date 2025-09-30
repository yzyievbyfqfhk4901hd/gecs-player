import React, { useState, useRef, useCallback } from 'react';
import './ProgressBar.css';

const ProgressBar = ({ currentTime, totalTime, progress, onSeek, onDragStart, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [wasPlayingBeforeDrag, setWasPlayingBeforeDrag] = useState(false);
  const progressBarRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSeekTime = useCallback((clientX) => {
    if (!totalTime || !onSeek || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = percentage * totalTime;
    
    onSeek(seekTime);
  }, [totalTime, onSeek]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    
    if (onDragStart) {
      const wasPlaying = onDragStart();
      setWasPlayingBeforeDrag(wasPlaying);
    }
    
    calculateSeekTime(e.clientX);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    calculateSeekTime(e.clientX);
  }, [isDragging, calculateSeekTime]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    
    if (onDragEnd && wasPlayingBeforeDrag) {
      onDragEnd();
    }
  }, [onDragEnd, wasPlayingBeforeDrag]);

  const handleClick = (e) => {
    if (!isDragging) {
      calculateSeekTime(e.clientX);
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="progress-container">
      <span className="time-current">{formatTime(currentTime)}</span>
      <div 
        ref={progressBarRef}
        className="progress-bar" 
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
        <div 
          className="progress-handle" 
          style={{ left: `${progress}%` }}
        ></div>
      </div>
      <span className="time-total">{formatTime(totalTime)}</span>
    </div>
  );
};

export default ProgressBar;
