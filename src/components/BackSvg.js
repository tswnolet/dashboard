import React from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BackSvg = ({ onClick, cookie, theme, scrolled }) => {
    const spanStyle = `var(${!scrolled ? '--text-color' : '--secondary-color'})`;

    return (
        <div className='backSvg' id={cookie ? 'cookieBackSvg' : ''} onClick={onClick}>
            <ArrowBackIcon sx={{ color: spanStyle }}/>
        </div>
    );
};

export default BackSvg;