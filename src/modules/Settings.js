import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackSvg from '../components/BackSvg';
import { allCookies, eraseCookie } from '../utils/cookies';
import '../styles/Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [cookies, setCookies] = useState([]);
  const [accountInfo, setAccountInfo] = useState({
    username: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    setCookies(allCookies());
    if (process.env.NODE_ENV === 'development') {
      setAccountInfo({
        username: 'devuser',
        email: 'devuser@example.com',
        password: 'password'
      });
    } else {
      fetchAccountInfo();
    }
  }, []);

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch('https://tylernolet.com/api/account.php');
      const data = await response.json();
      setAccountInfo({
        username: data.username,
        email: data.email,
        password: ''
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
    if (process.env.NODE_ENV === 'development') {
      console.log('Account info updated:', accountInfo);
    } else {
      try {
        const response = await fetch('https://tylernolet.com/api/account.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(accountInfo)
        });
        const data = await response.json();
        console.log('Account info updated:', data);
      } catch (error) {
        console.error('Error updating account info:', error);
      }
    }
  };

  return (
    <div id='settings' className='page-container'>
      <div className="section">
        <h2>Manage Cookies</h2>
        <ul>
          {cookies.map((cookie, index) => (
            <li key={index}>
              {cookie.name}: {cookie.value} (Expires: {cookie.expires})
              <button className='cookie-delete' onClick={() => handleCookieDelete(cookie.name)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="account-section">
        <h2>Account Information</h2>
        <label>
          Username:
          <input
            type="text"
            name="username"
            value={accountInfo.username}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={accountInfo.email}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            name="password"
            value={accountInfo.password}
            onChange={handleInputChange}
          />
        </label>
        <button onClick={handleAccountUpdate}>Update Account</button>
      </div>
    </div>
  );
};

export default Settings;