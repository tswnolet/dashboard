import React from 'react';
import '../styles/Modal.css';

const Modal = ({ children, onClose, title, wide = false, header, footer }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content${wide ? ' wide' : ''}`} onClick={(e) => e.stopPropagation()}>
                {title && 
                    <div className='modal-title'>
                        <h2>{title}</h2>
                        {header && header}
                    </div>
                }

                <div className="modal-body">
                    {children}
                </div>

                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}

                {!footer && !wide && (
                    <button className="modal-close" onClick={onClose}>×</button>
                )}
            </div>
        </div>
    );
};

export default Modal;