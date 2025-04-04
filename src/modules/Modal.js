import React from 'react';
import '../styles/Modal.css';

const Modal = ({ children, onClose, title, instructions = null, wide = false, header, footer }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content${wide ? ' wide' : ''}`} onClick={(e) => e.stopPropagation()}>
                {title && 
                    <div className='modal-title'>
                        <div className='title-container'>
                            <h2>{title}</h2>
                            {instructions && <span className='subtext'>{instructions}</span>}
                        </div>
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

                {!footer && !wide && !header && (
                    <button className="modal-close" onClick={onClose}>×</button>
                )}
            </div>
        </div>
    );
};

export default Modal;