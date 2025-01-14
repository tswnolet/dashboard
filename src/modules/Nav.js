import React, { useState, useEffect, useRef } from "react";
import Logo from '../resources/logo.png';

export default function Nav({ user, logout, title, theme, changeTheme, startDate, setStartDate, endDate, setEndDate, handleFilter }) {
  const [isChecked, setIsChecked] = useState(theme === 'dark');
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setIsChecked(theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFilterClick = () => {
    if (!startDate && !endDate) {
      handleFilter(true); // Pass true to indicate showing all data
    } else {
      handleFilter();
    }
    setShowDateInputs(false);
  };

  return (
    <nav style={{ borderBottomRightRadius: showAccountDropdown ? '0' : '10px' }}>
      <h3 id='page-title'>{title}</h3>
      <img src={Logo} alt="logo" id='nav-logo' style={{filter: theme === 'dark' ? 'brightness(1000%)' : 'brightness(0%)'}}/>
      <div id='nav-actions'>
        {showDateInputs && (
          <>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </>
        )}
        <button onClick={() => {
            setShowDateInputs(!showDateInputs) 
            showDateInputs && (handleFilterClick())
          }}
        >
          Filter
        </button>
        <label className="switch">
          <input 
            type="checkbox" 
            onChange={changeTheme} 
            checked={isChecked}
          />
          <span className="slider"></span>
        </label>
        <button className="account" onClick={() => setShowAccountDropdown(showAccountDropdown ? false : true)}>Account</button>
        <div ref={dropdownRef} className={`account-dropdown ${showAccountDropdown ? 'visible' : 'hidden'}`}>
          <h4 style={{ color: 'var(--text-color'}} className='account-greeting'>Welcome back, {user || 'Tyler'}!</h4>
          <button onClick={logout} className="logout">Logout</button>
        </div>
      </div>
    </nav>
  );
}