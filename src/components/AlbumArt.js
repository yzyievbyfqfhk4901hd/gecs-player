import React from 'react';
import { Music } from 'lucide-react';
import './AlbumArt.css';

const AlbumArt = ({ albumCover, title }) => {
  const [imageError, setImageError] = React.useState(false);
  
  console.log('AlbumArt render:', { 
    albumCover: albumCover ? `${albumCover.substring(0, 50)}...` : null, 
    title,
    hasAlbumCover: !!albumCover,
    isDataUrl: albumCover ? albumCover.startsWith('data:') : false,
    dataUrlFormat: albumCover ? albumCover.match(/^data:([^;]+);/) : null,
    imageError
  });
  
  React.useEffect(() => {
    if (albumCover) {
      console.log('Testing image load for:', title);
      console.log('Data URL format:', albumCover.match(/^data:([^;]+);base64,(.+)$/));
      
      const testImg = new Image();
      testImg.onload = () => {
        console.log('Test image loaded successfully for:', title);
        setImageError(false);
      };
      testImg.onerror = (e) => {
        console.error('Test image failed to load for:', title, e);
        console.error('Failed data URL:', albumCover.substring(0, 100) + '...');
        setImageError(true);
      };
      testImg.src = albumCover;
    }
  }, [albumCover, title]);
  
  return (
    <div className="album-art-container">
      <div className="album-art">
        {albumCover && !imageError ? (
          <img 
            src={albumCover} 
            alt={title} 
            className="album-image"
            onLoad={() => {
              console.log('Album art loaded successfully for:', title);
              setImageError(false);
            }}
            onError={(e) => {
              console.error('Album art failed to load for:', title, e);
              setImageError(true);
            }}
          />
        ) : (
          <div className="album-placeholder">
            <Music size={48} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumArt;
