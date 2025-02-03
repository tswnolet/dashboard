import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import '../Loading.css';

const Loading = () => {
  return (
    <Box className='loading' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  )
}

export default Loading;