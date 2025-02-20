import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../resources/logo.png';
import BackSvg from '../components/BackSvg';
import MobileMenu from "./MobileMenu";
import '../styles/Nav.css';
import { Theme } from "./Theme";

const Nav = ({ user, loggedIn, logout, theme, changeTheme }) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [scrolled, setScrolled] = useState(false);
  const [title, setTitle] = useState('');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Routing options
  const routes = {
    "Weather Events": "/weather",
    "New Data": "/new-data",
  };

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('nav');
      if (window.scrollY > 0) {
        nav.classList.add('scrolled');

        setScrolled(true);
      } else {
        nav.classList.remove('scrolled');
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const formatTitle = (path) => path.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    setTitle(formatTitle(location.pathname.substring(1)));
  }, [location]);

  return (
    <>
      <div id="scrolled" style={{ opacity: scrolled ? "1" : "0" }}></div>
      <nav>
        <div id='page-title'>
          {title !== 'Dashboard' && loggedIn && <BackSvg onClick={() => navigate(-1)} theme={theme} scrolled={scrolled} />}
          <h3 className='page-title'>{title}</h3>
        </div>
        <img
          src={Logo}
          alt="logo"
          id='nav-logo'
          onClick={() => navigate('/')}
          style={{
            filter: theme === 'dark' ? `brightness(${scrolled ? '0%' : '1000%'})` : `brightness(${scrolled ? '1000%' : '0%'})`
          }}
        />
        {isMobile ? (
          <MobileMenu theme={theme} scrolled={scrolled} routes={routes} logout={logout} />
        ) : (
          loggedIn ? (
            <div id='nav-actions'>
              {Object.entries(routes).map(([title, path]) => (
                location.pathname !== path && (
                  <button key={title} className='nav-btn' onClick={() => navigate(path)}>
                    {title}
                  </button>
                )
              ))}
              <button ref={buttonRef} className="account nav-btn" onClick={() => setShowAccountDropdown(prev => !prev)}>
                Account
              </button>
              <div ref={dropdownRef} className={`account-dropdown ${showAccountDropdown ? 'visible' : 'hidden'}`}>
                <h4 className='account-greeting'>Welcome back, {user || 'User'}!</h4>
                <button onClick={() => { navigate('/settings'); setShowAccountDropdown(false); }} disabled={location.pathname === '/settings'}>Settings</button>
                <button onClick={logout} className="logout">Logout</button>
                <Theme theme={theme} changeTheme={changeTheme} />
              </div>
            </div>
          ) : (
            <Theme theme={theme} changeTheme={changeTheme} />
          )
        )}
      </nav>
    </>
  );
};

export default Nav;