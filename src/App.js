import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Loading from './modules/Loading';
import Dashboard from './modules/Dashboard';
import Context from './modules/Context';
import Settings from './modules/Settings';
import Nav from './modules/Nav';
import NewCardForm from './modules/NewCardForm';
import { getCookie, setCookie } from './utils/cookies';
import './styles/Cookies.css';
import './styles/Theme.css';
import './styles/NewCardForm.css';
import Weather from './modules/Weather';
import LeadUploader from './modules/LeadUploader';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [theme, setTheme] = useState(getCookie('theme') || 'light');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    setCookie('theme', theme, 365);
  }, [theme]);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

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
      const response = await fetch('/api/session.php');
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
    await fetch('/api/session.php?close', { method: 'GET' });
    setLoggedIn(false);
    window.location.href = '/login';
  };

  const addCard = (newCard) => {
    setData([...data, newCard]);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
        <ConditionalNav loggedIn={loggedIn} changeTheme={changeTheme} theme={theme} logout={logout} data={data} setData={setData} setFilteredData={setFilteredData} />
        <AppRoutes loggedIn={loggedIn} setLoggedIn={setLoggedIn} changeTheme={changeTheme} theme={theme} data={filteredData} setData={setData} addCard={addCard} logout={logout} setFilteredData={setFilteredData} />
    </Router>
  );
}

const ConditionalNav = ({ loggedIn, changeTheme, theme, logout, data, setData, setFilteredData }) => {
  const location = useLocation();
  const pathName = location.pathname.substring(1);

  const formatTitle = (path) => {
    return path
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const title = formatTitle(pathName);

  if (pathName === 'login' || pathName === 'signup') {
    return null;
  }

  return <Nav title={title || 'Dashboard'} loggedIn={loggedIn} changeTheme={changeTheme} theme={theme} logout={logout} />;
};

const AppRoutes = ({ loggedIn, setLoggedIn, changeTheme, theme, data, setData, addCard, logout, setFilteredData }) => {
  return (
    <Routes>
      <Route path="/referral" element={<LeadUploader />} />
      {loggedIn ? (
        <>
          <Route path="/dashboard" element={<Dashboard setLoggedIn={setLoggedIn} changeTheme={changeTheme} theme={theme} data={data} setData={setData} setFilteredData={setFilteredData} />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/settings" element={<Settings changeTheme={changeTheme} theme={theme} logout={logout} data={data} setData={setData} setFilteredData={setFilteredData} />} />
          <Route path="/new-data" element={<NewCardForm addCard={addCard} />} />
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