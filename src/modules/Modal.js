import React from 'react';
import '../styles/Modal.css';

const Modal = ({ children, onClose, title, contact_title = null, instructions = null, single = false, wide = false, header, footer }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content${wide ? ' wide' : ''}${single ? ' single-view' : ''}`} onClick={(e) => e.stopPropagation()}>

                <div className='modal-title'>
                    <div className='title-container'>
                        {contact_title ? (
                            <>
                                <h2>{title}</h2>
                                <div className='case-name-item'>
                                    <div className='contact-initials'>
                                        {contact_title.contact_display?.includes('uploads') ? (
                                            <img src={`https://api.casedb.co/${contact_title.contact_display}`} />
                                        ) : (
                                            contact_title.contact_display
                                        )}
                                    </div>
                                    <div>{contact_title.case_name}</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2>{title}</h2>
                                {instructions && <span className='subtext'>{instructions}</span>}
                            </>
                        )}
                    </div>
                    {header && header}
                </div>

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