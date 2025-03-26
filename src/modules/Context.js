import React, { useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Login from "./Login";
import SignUp from "./SignUp";
import Alert from "./Alert";
import '../Context.css';
import '../index.css';

const Context = ({ setAccessLevel, setUser, setLoggedIn, setShowAlert, showAlert }) => {
  const [formData, setFormData] = useState({ user: '', password: '', confirm_password: '', email: '' });
  const [close, setClose] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';

  const fetchData = (e) => {
    e.preventDefault();
    fetch(`/api/${isLogin ? 'login' : 'signup'}.php`, {
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
            setUser(data.name.split(' ')[0]);
            setTimeout(() => {
              setLoggedIn(true);
              const accessLevel = data.access_level || 'user';
              const defaultRoute = accessLevel === 'global admin' ? '/dashboard' : '/cases';
              setAccessLevel(accessLevel);
              const redirectTo = location.state?.from || defaultRoute;
              navigate(redirectTo);
            }, 2000);
          } else {
            navigate('/login');
          }
        } else {
          setError(data.error || 'An error occurred.');
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
    <div id='context' style={{ animation: close ? 'fade-out 2s forwards' : '' }}>
      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      <form id='context-form' onSubmit={fetchData}>
        {window.innerWidth <= 1024 && <h2>Your data. All in. <span style={{ fontWeight: "900" }}>All the time.</span></h2>}
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
        {window.innerWidth > 1024 && <h2>Your data. All in. <span style={{ fontWeight: "900" }}>All the time.</span></h2>}
      </div>
      {showAlert && <Alert message="User logged out." type="info" onClose={() => setShowAlert(false)} />}
    </div>
  );
}

export default Context;