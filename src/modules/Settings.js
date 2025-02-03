import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from './Alert';
import { allCookies, eraseCookie } from '../utils/cookies';
import { Box, Typography, Button, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
// import DeleteIcon from '@mui/icons-material/Delete';
import '../styles/Settings.css';
import '../Alert.css';

const Settings = () => {
  const navigate = useNavigate();
  const [cookies, setCookies] = useState([]);
  const [accountInfo, setAccountInfo] = useState({
    user: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState(null);

  const handleError = (err) => {
    setError({message: err, type: 'error'});
  }

  useEffect(() => {
    setCookies(allCookies());
    if (process.env.NODE_ENV === 'development') {
      setAccountInfo({
        user: 'devuser',
        email: 'devuser@example.com',
        password: 'default',
        confirm_password: 'default'
      });
    } else {
      fetchAccountInfo();
    }
  }, []);

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch('/api/account.php');
      const data = await response.json();
      setAccountInfo({
        user: data.user,
        email: data.email,
        password: 'default',
        confirm_password: 'default'
      });
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  const handleCookieDelete = (name) => {
    eraseCookie(name);
    setCookies(allCookies());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAccountInfo(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAccountUpdate = async () => {
    if (accountInfo.password !== accountInfo.confirm_password) {
      setError({message: 'Passwords do not match.', type: 'error'});
      return;
    }

    const updatedAccountInfo = {};
    for (const key in accountInfo) {
        if (accountInfo[key] !== '' && accountInfo[key] !== 'default') {
            updatedAccountInfo[key] = accountInfo[key];
        }
    }

    if (Object.keys(updatedAccountInfo).length === 0) {
        setError({message: 'No changes were made.', type: 'error'});
        return;
    }

    try {
        const response = await fetch('/api/account.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedAccountInfo)
        });
        const data = await response.json();
        if (data.success) {
          setError({message: 'Account updated successfully.', type: 'success'});
        } else {
          setError({message: data.message, type: 'error'});
        }
    } catch (error) {
      setError({message: 'Error updating account info.', type: 'error'});
    }
  };

  return (
    <Box id='settings' className='page-container'>
      {error && <Alert message={error.message} type={error.type} onClose={() => setError(null)} />}
      <Box className="section">
        <Typography variant="h4">Manage Cookies</Typography>
        <List>
          {cookies.map((cookie, index) => (
            <ListItem key={index} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleCookieDelete(cookie.name)}>
                {/* Placeholder for DeleteIcon */}
              </IconButton>
            }>
              <ListItemText primary={`${cookie.name}: ${cookie.value} (Expires: ${cookie.expires})`} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box className="account-section">
        <Typography variant="h4">Account Information</Typography>
        <Box className='input-section-container'>
          <Box className='label-container'>
            <TextField
              label="Username"
              name="user"
              value={accountInfo.user}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Email"
              name="email"
              value={accountInfo.email}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              value={accountInfo.password}
              onClick={(e) => {
                if (accountInfo.password === 'default') {
                  e.target.value = '';
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  e.target.value = accountInfo.password;
                }
              }}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Confirm Password"
              type="password"
              name="confirm_password"
              value={accountInfo.confirm_password}
              onClick={(e) => {
                if (accountInfo.confirm_password === 'default') {
                  e.target.value = '';
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  e.target.value = accountInfo.password;
                }
              }}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
          </Box>
        </Box>
        <Button variant="contained" onClick={handleAccountUpdate}>Update Account</Button>
      </Box>
    </Box>
  );
};

export default Settings;