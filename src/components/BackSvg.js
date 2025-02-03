import React from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BackSvg = ({ onClick, cookie }) => (
    <div className='backSvg' id={cookie ? 'cookieBackSvg' : ''} onClick={onClick}>
        <ArrowBackIcon sx={{ color: 'var(--text-color)' }} />
    </div>
);

export default BackSvg;