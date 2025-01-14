import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Logo from '../resources/logo.png';
import BackSvg from '../components/BackSvg';
import MobileMenu from "./MobileMenu";

export default function Nav({ user, logout, title, theme, changeTheme, startDate, setStartDate, endDate, setEndDate, handleFilter }) {
  const [isChecked, setIsChecked] = useState(theme === 'dark');
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsChecked(theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleFilterClick = () => {
    if (!startDate && !endDate) {
      handleFilter(true);
    } else {
      handleFilter();
    }
    setShowDateInputs(false);
  };

  const handleAccountClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setShowAccountDropdown(prev => !prev);
  };

  return (
    <nav>
      {isMobile ? (
        <MobileMenu />
      ) : (
        <>
          <div id='page-title'>
            {title !== 'Dashboard' && <BackSvg onClick={() => navigate(-1)} />}
            <h3 id='page-title'>{title}</h3>
          </div>
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
            <button ref={buttonRef} className="account" onClick={handleAccountClick}>Account</button>
            <div ref={dropdownRef} className={`account-dropdown ${showAccountDropdown ? 'visible' : 'hidden'}`} onClick={(e) => e.stopPropagation()}>
              <h4 style={{ color: 'var(--text-color'}} className='account-greeting'>Welcome back, {user || 'Tyler'}!</h4>
              <button onClick={() => navigate('/settings')} className="settings">Settings</button>
              <button onClick={logout} className="logout">Logout</button>
              <label className="switch">
                <input 
                  type="checkbox" 
                  onChange={changeTheme} 
                  checked={isChecked}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}