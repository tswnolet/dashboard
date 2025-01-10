import React, { useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Login from "./Login";
import SignUp from "./SignUp";
import Alert from "./Alert";
import '../Context.css';
import '../index.css';

const Context = ({ setLoggedIn }) => {
  const [formData, setFormData] = useState({ user: '', password: '', confirm_password: '' });
  const [close, setClose] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';

  // Function to handle form submission
  const fetchData = (e) => {
    e.preventDefault();
    fetch(`https://tylernolet.com/api/${isLogin ? 'user' : 'signup'}.php`, {
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

  // Function to handle form input changes
  const formUpdate = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div id='context' style={{ animation: close ? 'fade-out 2s forwards' : '' }}>
      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      <form id='context-form' onSubmit={fetchData}>
        {isLogin ? <Login formUpdate={formUpdate} formData={formData} /> : <SignUp formUpdate={formUpdate} formData={formData} />}
        <button type="submit" className='action-btn'>
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
        <button type='button' className='change-context' onClick={() => navigate(isLogin ? '/signup' : '/login')} aria-label="Switch to Login">
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </form>
      
      <div id="context-bg">
        <div id="context-bg-container">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <h2>A new approach to your data.</h2>
      </div>
    </div>
  );
}

export default Context;