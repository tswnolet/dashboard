import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Loading from './modules/Loading';
import Dashboard from './modules/Dashboard';
import Context from './modules/Context';
import Settings from './modules/Settings';
import Nav from './modules/Nav';
import { getCookie, setCookie } from './utils/cookies';
import './styles/Cookies.css';
import './styles/Theme.css';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [theme, setTheme] = useState(getCookie('theme') || 'light');

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    setCookie('theme', theme, 365);
  }, [theme]);

  const changeTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const checkUserLoggedIn = async () => {
    if (process.env.NODE_ENV === 'development') {
      setLoggedIn(true);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('https://tylernolet.com/api/session.php');
      const data = await response.json();
      if (data.isLoggedIn) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (process.env.NODE_ENV === 'development') {
        return;
    }
    await fetch('https://tylernolet.com/api/session.php?close', { method: 'GET' });
    setLoggedIn(false);
    window.location.href = '/login';
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
        <ConditionalNav changeTheme={changeTheme} theme={theme} logout={logout} />
        <AppRoutes loggedIn={loggedIn} setLoggedIn={setLoggedIn} changeTheme={changeTheme} theme={theme} />
    </Router>
  );
}

const ConditionalNav = ({ changeTheme, theme, logout }) => {
  const location = useLocation();
  const pathName = location.pathname.substring(1);
  const title = pathName.charAt(0).toUpperCase() + pathName.slice(1);

  if (pathName === 'login' || pathName === 'signup') {
    return null;
  }

  return <Nav title={title || 'Dashboard'} changeTheme={changeTheme} theme={theme} logout={logout} />;
};

const AppRoutes = ({ loggedIn, setLoggedIn, changeTheme, theme }) => {
  return (
    <Routes>
      {loggedIn ? (
        <>
          <Route path="/dashboard" element={<Dashboard setLoggedIn={setLoggedIn} changeTheme={changeTheme} theme={theme} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </>
      ) : (
        <>
          <Route path="/login" element={<Context setLoggedIn={setLoggedIn} />} />
          <Route path="/signup" element={<Context setLoggedIn={setLoggedIn} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      )}
    </Routes>
  );
}

export default App;