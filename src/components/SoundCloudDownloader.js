import React, { useState, useEffect } from 'react';
import './SoundCloudDownloader.css';

const SoundCloudDownloader = ({ onDownloadComplete }) => {
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (downloadStatus) {
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
        setTimeout(() => setDownloadStatus(''), 300);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [downloadStatus]);

  const handleUrlChange = async (e) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    
    if (inputUrl.trim()) {
      const isValid = await window.electronAPI.validateSoundCloudUrl(inputUrl);
      setIsValidUrl(isValid);
    } else {
      setIsValidUrl(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim() || !isValidUrl) return;

    setIsDownloading(true);
    setDownloadStatus('Starting download...');

    try {
      const result = await window.electronAPI.downloadSoundCloudTrack(url);
      
      if (result.success) {
        setDownloadStatus(`Downloaded: ${result.filename}`);
        setUrl('');
        setIsValidUrl(false);
        
        if (onDownloadComplete) {
          onDownloadComplete(result);
        }
      } else {
        setDownloadStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setDownloadStatus(`Error: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isValidUrl && !isDownloading) {
      handleDownload();
    }
  };

  const handleCloseStatus = () => {
    setShowStatus(false);
    setTimeout(() => setDownloadStatus(''), 300);
  };

  return (
    <div className="soundcloud-downloader">
      <h3>Download from SoundCloud</h3>
      <div className="download-input-container">
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          onKeyPress={handleKeyPress}
          placeholder="Paste SoundCloud URL here..."
          className={`download-input ${isValidUrl ? 'valid' : url ? 'invalid' : ''}`}
          disabled={isDownloading}
        />
        <button
          onClick={handleDownload}
          disabled={!isValidUrl || isDownloading}
          className="download-button"
        >
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>
      </div>
      
      {downloadStatus && (
        <div className={`download-status ${downloadStatus.includes('Error') ? 'error' : 'success'} ${showStatus ? 'show' : 'hide'}`}>
          <span className="status-text">{downloadStatus}</span>
          <button 
            className="close-button" 
            onClick={handleCloseStatus}
            title="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default SoundCloudDownloader;
