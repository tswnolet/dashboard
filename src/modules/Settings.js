import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from './Alert';
import { allCookies, eraseCookie } from '../utils/cookies';
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
    <div id='settings' className='page-container'>
      {error && <Alert message={error.message} type={error.type} onClose={() => setError(null)} />}
      <div className="section">
        <h2>Manage Cookies</h2>
        <ul>
          {cookies.map((cookie, index) => (
            <li key={index}>
              {cookie.name}: {cookie.value} (Expires: {cookie.expires})
              <button className='delete' onClick={() => handleCookieDelete(cookie.name)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="account-section">
        <h2>Account Information</h2>
        <div className='input-section-container'>
          <div className='label-container'>
            <label htmlFor="user">Username:</label>
            <label htmlFor="email">Email:</label>
            <label htmlFor="password">Password:</label>
            <label htmlFor="confirm_password">Confirm Password:</label>
          </div>
          <div className='input-container'>
            <input
              type="text"
              name="user"
              value={accountInfo.user}
              onChange={handleInputChange}
            />
            <input
              type="email"
              name="email"
              value={accountInfo.email}
              onChange={handleInputChange}
            />
            <input
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
            />
            <input
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
            />
          </div>
        </div>
        <button onClick={handleAccountUpdate}>Update Account</button>
      </div>
    </div>
  );
};

export default Settings;