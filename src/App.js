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
import { PrivacyPolicy } from './modules/PrivacyPolicy';
import { WIP } from './modules/WIP';
import { LayoutEditor } from './modules/LayoutEditor';
import { Contacts } from './modules/Contacts';
import { CustomFields } from './modules/Customs';
import { Leads } from './modules/Leads';
import { Cases } from './modules/Cases';
import { FileUpload, FileList } from './modules/ExhibitViewer';
import { Case } from './modules/Case';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(null);
  const [theme, setTheme] = useState(getCookie('theme') || 'light');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/dashboard?report=thisyear');
  const [user, setUser] = useState(null);
  const [accessLevel, setAccessLevel] = useState(null);

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
    setLoggedIn(null);

    if (process.env.NODE_ENV === 'development') {
      setLoggedIn(true);
      setAccessLevel('global admin');
      setUser({ user: 'devuser', user_id: 1 });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.casedb.co/session.php', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.isLoggedIn) {
        setLoggedIn(true);
        setAccessLevel(data.access_level);
        setUser(data);
        setCookie('session', 'active', 1);
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

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const logout = async () => {
    if (process.env.NODE_ENV === 'development') {
        return;
    }
    await fetch('https://api.casedb.co/session.php?close', { method: 'GET', credentials: 'include' });
    setLoggedIn(false);
    window.location.href = '/login';
    setShowAlert(true);
  };

  const addCard = (newCard) => {
    setData([...data, newCard]);
  };

  if (loading || loggedIn === null) {
    return <Loading />;
  }

  return (
    <Router>
        <ConditionalNav accessLevel={accessLevel} user={user} loggedIn={loggedIn} changeTheme={changeTheme} theme={theme} logout={logout} data={data} setData={setData} setFilteredData={setFilteredData} />
        <AppRoutes accessLevel={accessLevel} setAccessLevel={setAccessLevel} setUser={setUser} user={user} loggedIn={loggedIn} setLoggedIn={setLoggedIn} changeTheme={changeTheme} theme={theme} data={filteredData} setData={setData} addCard={addCard} logout={logout} setFilteredData={setFilteredData} setShowAlert={setShowAlert} showAlert={showAlert} redirectPath={redirectPath} setRedirectPath={setRedirectPath} />
    </Router>
  );
}

const ConditionalNav = ({ accessLevel, user, loggedIn, changeTheme, theme, logout, data, setData, setFilteredData }) => {
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

  return <Nav title={title || 'Dashboard'} accessLevel={accessLevel} user={user?.user} loggedIn={loggedIn} changeTheme={changeTheme} theme={theme} logout={logout} />;
};

const AppRoutes = ({ accessLevel, setAccessLevel, setUser, user, loggedIn, setLoggedIn, changeTheme, theme, data, setData, addCard, logout, setFilteredData, setShowAlert, showAlert, redirectPath, setRedirectPath }) => {
  const location = useLocation();

  useEffect(() => {
    if (!loggedIn && location.pathname !== '/login' && location.pathname !== '/signup') {
      setRedirectPath(location.pathname + location.search);
    }
  }, [loggedIn, location, setRedirectPath]);

  if (loggedIn === null) {
    return <Loading />;
  }

  return (
    <Routes>
      {loggedIn === true ? (
        <>
          <Route path="/cases" element={<Cases user={user} />} />
          <Route path="/case/:id" element={<Case id={":id"} user_id={user.user_id}/>} />
          <Route path="/intake" element={<Leads user={user} />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/client-portal" element={<WIP />} />
          <Route path="/firm-settings" element={<WIP />} />
          <Route path="/dashboard/weather" element={<Weather theme={theme} />} />
          <Route path="/settings" element={<Settings changeTheme={changeTheme} theme={theme} logout={logout} data={data} setData={setData} setFilteredData={setFilteredData} />} />
          <Route path="/new-data" element={<NewCardForm addCard={addCard} />} />
          <Route path="*" element={<Navigate to={redirectPath} />} />
          <Route path="/google" element={<Dashboard google={true} />} />
          <Route path="/firm-settings/custom-fields" element={<CustomFields />} />
          <Route path="/firm-settings/layout-editor" element={<LayoutEditor />} />
          <Route path='/library' element={<FileList />} />
          {accessLevel === 'global admin' ? ( 
            <Route path="/dashboard" element={<Dashboard setLoggedIn={setLoggedIn} />} />
          ) : (
            <Route path='/dashboard' element={<Cases user={user} />} />
          )}
        </>
      ) : (
        <>
          <Route path="/login" element={<Context setAccessLevel={setAccessLevel} setUser={setUser} setLoggedIn={setLoggedIn} setShowAlert={setShowAlert} showAlert={showAlert} />} />
          <Route path="/signup" element={<Context setAccessLevel={setAccessLevel} setLoggedIn={setLoggedIn} setShowAlert={setShowAlert} showAlert={showAlert} />} />
          <Route path="*" element={<Navigate to="/login" state={{ from: location.pathname + location.search }} />} />
        </>
      )}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    </Routes>
  );
}

export default App;