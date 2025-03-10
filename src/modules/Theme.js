import React, { useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#555555',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
  },
});

export const Theme = ({ theme, changeTheme }) => {
  const [isChecked, setIsChecked] = useState(theme === 'dark');

  useEffect(() => {
    setIsChecked(theme === 'dark');
  }, [theme]);

  return (
    <ThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
      <CssBaseline />
      <label htmlFor='theme-switch' className="switch">
        <input
          type="checkbox"
          onChange={changeTheme}
          checked={isChecked}
          name='theme-switch'
          id='theme-switch'
        />
        <span className="slider"></span>
      </label>
    </ThemeProvider>
  );
};