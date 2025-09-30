import React from 'react';
import './ConfirmationPopup.css';

const ConfirmationPopup = ({ 
  isVisible, 
  title, 
  message, 
  warningText, 
  onConfirm, 
  onCancel, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  confirmButtonClass = "delete-btn-confirm"
}) => {
  if (!isVisible) return null;

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-popup">
        <h3>{title}</h3>
        <p>{message}</p>
        {warningText && <p className="warning-text">{warningText}</p>}
        <div className="confirmation-buttons">
          <button className="cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={confirmButtonClass} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
