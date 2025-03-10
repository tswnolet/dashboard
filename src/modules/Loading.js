import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import '../Loading.css';

const Loading = () => {
  return (
    <div className='loading'>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}

export default Loading;