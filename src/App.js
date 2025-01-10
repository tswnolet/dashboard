import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Loading from './modules/Loading';
import Dashboard from './modules/Dashboard';
import Context from './modules/Context';
import { getCookie, setCookie } from './utils/cookies';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [theme, setTheme] = useState(getCookie('theme') || 'light');

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.style.setProperty('--background-color', '#f4f4f4');
      document.documentElement.style.setProperty('--secondary-color', '#ffffff');
      document.documentElement.style.setProperty('--text-color', '#333');
      document.documentElement.style.setProperty('--border-color', '#ddd');
    } else {
      document.documentElement.style.setProperty('--background-color', '#212121');
      document.documentElement.style.setProperty('--secondary-color', '#333');
      document.documentElement.style.setProperty('--text-color', 'white');
      document.documentElement.style.setProperty('--border-color', '#444444');
    }
    setCookie('theme', theme, 365);
  }, [theme]);

  const changeTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  // Function to check if the user is logged in
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

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
      <div className={`app ${theme}`}>
        <AppRoutes loggedIn={loggedIn} setLoggedIn={setLoggedIn} changeTheme={changeTheme} theme={theme} />
      </div>
    </Router>
  );
}

// Component to handle application routes
const AppRoutes = ({ loggedIn, setLoggedIn, changeTheme, theme }) => {
  return (
    <Routes>
      {loggedIn ? (
        <>
          <Route path="/dashboard" element={<Dashboard setLoggedIn={setLoggedIn} changeTheme={changeTheme} theme={theme} />} />
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