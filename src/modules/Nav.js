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
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const formatTitle = (path) => {
      return path
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const pathName = location.pathname.substring(1);
    setTitle(formatTitle(pathName));
  }, [location]);

  const handleAccountClick = (e) => {
    setShowAccountDropdown(prev => !prev);
  };

  return (
    <>
      <div id="scrolled" style={{opacity: scrolled ? "1" : "0"}}></div>
      <nav>
        <div id='page-title'>
          {title !== 'Dashboard' && loggedIn && <BackSvg onClick={() => navigate(-1)} />}
          <h3 className='page-title'>{title}</h3>
        </div>
        <img src={Logo} alt="logo" id='nav-logo'
          onClick={() => {
              navigate('/')
            }
          }
            style={{filter: theme === 'dark' ? `brightness(${scrolled ? '0%' : '1000%'})` : `brightness(${scrolled ? '1000%' : '0%'})`}}/>
          {isMobile ? (
            <MobileMenu />
          ) : (loggedIn ? (
            <div id='nav-actions'>
              {location.pathname !== '/weather' && (
                <button className='weather-events nav-btn' onClick={() => {
                    navigate('/weather')}
                  }
                >
                  Weather Events
                </button>
              )}
              {location.pathname !== '/new-data' &&
                <button className='nav-btn' onClick={() => {
                    navigate('/new-data')
                  }}
                >
                  New Data
                </button>
              }
              {location.pathname !== '/referral' &&
                <button className='nav-btn' onClick={() => {
                    navigate('/referral')
                  }}
                >
                  Referral
                </button>
              }
              <button ref={buttonRef} className="account nav-btn" onClick={handleAccountClick}>Account</button>
              <div ref={dropdownRef} className={`account-dropdown ${showAccountDropdown ? 'visible' : 'hidden'}`} onClick={(e) => e.stopPropagation()}>
                <h4 style={{ color: 'var(--text-color'}} className='account-greeting'>Welcome back, {user || 'Tyler'}!</h4>
                <button onClick={() => {
                    navigate('/settings');
                    handleAccountClick();
                  }}
                  disabled={location.pathname === '/settings'}
                  className="settings"
                >
                  Settings
                </button>
                <button onClick={logout} className="logout">Logout</button>
                <Theme theme={theme} changeTheme={changeTheme} />
              </div>
            </div>
          ) : (
            <Theme theme={theme} changeTheme={changeTheme} />
          ))}
      </nav>
    </>
  );
}

export default Nav;