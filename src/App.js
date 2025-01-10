import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Loading from './modules/Loading';
import Dashboard from './modules/Dashboard';
import Context from './modules/Context';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
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
      <AppRoutes loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
    </Router>
  );
}

const AppRoutes = ({ loggedIn, setLoggedIn }) => {
  return (
    <Routes>
      {loggedIn ? (
        <>
          <Route path="/dashboard" element={<Dashboard setLoggedIn={setLoggedIn} />} />
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