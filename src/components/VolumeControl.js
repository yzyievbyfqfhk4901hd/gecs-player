import React, { useState, useRef, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import './VolumeControl.css';

const VolumeControl = ({ volume, onVolumeChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const volumeBarRef = useRef(null);

  const calculateVolume = useCallback((clientX) => {
    if (!onVolumeChange || !volumeBarRef.current) return;
    
    const rect = volumeBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const newVolume = Math.max(0, Math.min(100, percentage));
    
    onVolumeChange(newVolume);
  }, [onVolumeChange]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    calculateVolume(e.clientX);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    calculateVolume(e.clientX);
  }, [isDragging, calculateVolume]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = (e) => {
    if (!isDragging) {
      calculateVolume(e.clientX);
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

  const showPercentage = isDragging || isHovered;

  return (
    <div className="volume-control">
      <span className="volume-icon">
        <Volume2 size={20} />
      </span>
      <div 
        ref={volumeBarRef}
        className="volume-bar" 
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div 
          className="volume-fill" 
          style={{ width: `${volume}%` }}
        ></div>
        <div 
          className="volume-handle" 
          style={{ left: `${volume}%` }}
        >
          {showPercentage && (
            <div className="volume-percentage">
              {Math.round(volume)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolumeControl;
