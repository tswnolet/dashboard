import React from 'react';
import '../styles/Modal.css';

const Modal = ({ children, onClose, wide = false }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content${wide ? ' wide' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                {children}
            </div>
        </div>
    );
};

export default Modal;