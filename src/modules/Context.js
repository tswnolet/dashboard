import React, { useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Login from "./Login";
import SignUp from "./SignUp";
import Alert from "./Alert";
import { Box, Button, Typography, TextField } from '@mui/material';
import '../Context.css';
import '../index.css';

const Context = ({ setLoggedIn, setShowAlert, showAlert }) => {
  const [formData, setFormData] = useState({ user: '', password: '', confirm_password: '', email: '' });
  const [close, setClose] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';

  // Function to handle form submission
  const fetchData = (e) => {
    e.preventDefault();
    fetch(`/api/${isLogin ? 'user' : 'signup'}.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          if (isLogin) {
            localStorage.setItem('token', data.token);
            setClose(true);
            setTimeout(() => {
              setLoggedIn(true);
              navigate('/dashboard');
            }, 2000);
          } else {
            navigate('/login');
          }
        } else {
          setError(`Error: ${data.error}!` || 'An error occurred.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('An error occurred');
      });
  };

  const formUpdate = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <Box id='context' sx={{ animation: close ? 'fade-out 2s forwards' : '' }}>
      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      <Box component="form" id='context-form' onSubmit={fetchData}>
        {window.innerWidth <= 1024 && <Typography variant="h2">Your data. All in. <span style={{ fontWeight: "900" }}>All the time.</span></Typography>}
        {isLogin ? <Login formUpdate={formUpdate} formData={formData} /> : <SignUp formUpdate={formUpdate} formData={formData} />}
        <Button type="submit" className='action-btn'>
          {isLogin ? 'Login' : 'Sign Up'}
        </Button>
        <Button type='button' className='change-context' onClick={() => navigate(isLogin ? '/signup' : '/login')} aria-label="Switch to Login">
          {isLogin ? 'Sign Up' : 'Login'}
        </Button>
      </Box>
      <Box id="context-bg">
        <Box id="context-bg-container">
          <Box></Box>
          <Box></Box>
          <Box></Box>
          <Box></Box>
        </Box>
        {window.innerWidth > 1024 && <Typography variant="h2">Your data. All in. <span style={{ fontWeight: "900" }}>All the time.</span></Typography>}
      </Box>
      {showAlert && <Alert message="User logged out." type="info" onClose={() => setShowAlert(false)} />}
    </Box>
  );
}

export default Context;