import React from 'react';

const BackSvg = ({ onClick, cookie }) => (
    <div className='backSvg' id={cookie ? 'cookieBackSvg' : ''} onClick={onClick}>
        <svg id="fi_3114883" height="512" viewBox="0 0 24 24" width="512" xmlns="http://www.w3.org/2000/svg" dataname="Layer 2">
            <path d="m22 11h-17.586l5.293-5.293a1 1 0 1 0 -1.414-1.414l-7 7a1 1 0 0 0 0 1.414l7 7a1 1 0 0 0 1.414-1.414l-5.293-5.293h17.586a1 1 0 0 0 0-2z"></path>
        </svg>
    </div>
);

export default BackSvg;