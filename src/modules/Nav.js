import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../resources/logo.png';
import BackSvg from '../components/BackSvg';
import MobileMenu from "./MobileMenu";
import '../styles/Nav.css';
import { Theme } from "./Theme";

const Nav = ({ user, logout, theme, changeTheme, data, setData, setFilteredData }) => {
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
        if(window.innerWidth > 1024) {
          nav.classList.add('scrolled');
        }
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

  const handleFilter = (showAll = false) => {
    if (showAll) {
      setFilteredData(data);
    } else {
      const filteredData = data.filter(item => {
          const itemStartDate = new Date(item.startDate);
          const itemEndDate = new Date(item.endDate);
          const filterStartDate = new Date(startDate);
          const filterEndDate = new Date(endDate);
          return itemStartDate >= filterStartDate && itemEndDate <= filterEndDate;
      });
      setFilteredData(filteredData);
    }
  };

  const handleFilterClick = () => {
    if (!startDate && !endDate) {
      handleFilter(true);
    } else {
      handleFilter();
    }
    setShowDateInputs(false);
  };

  const handleAccountClick = (e) => {
    setShowAccountDropdown(prev => !prev);
  };

  return (
    <>
      <div id="scrolled" style={{opacity: scrolled ? "1" : "0"}}></div>
      <nav>
        <div id='page-title'>
          {title !== 'Dashboard' && user && <BackSvg onClick={() => navigate(-1)} />}
          <h2 className='page-title'>{title}</h2>
        </div>
        <img src={Logo} alt="logo" id='nav-logo'
          onClick={() => {
              navigate('/')
            }
          }
            style={{filter: theme === 'dark' ? `brightness(${scrolled ? '0%' : '1000%'})` : `brightness(${scrolled ? '0%' : '1000%'})`}}/>
          {isMobile ? (
            <MobileMenu />
          ) : (user ? (
            <div id='nav-actions'>
              {showDateInputs && title === 'Dashboard' && (
                <div id='filter-container'>
                  <input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <input type="date" className="date-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              )}
              {title === 'Dashboard' && (
                <button id='filter-button' style={{ backgroundColor: showDateInputs ? 'var(--secondary-color' : 'transparent', borderBottomLeftRadius: '0', borderBottomRightRadius: '0'}} onClick={() => {
                    setShowDateInputs(!showDateInputs) 
                    showDateInputs && (handleFilterClick())
                  }}
                >
                  Filter
                </button>
              )}
              {location.pathname !== '/weather' && (
                <button className='weather-events' onClick={() => {
                    navigate('/weather')}
                  }
                >
                  Weather Events
                </button>
            )}
              {location.pathname !== '/new-data' &&
                <button onClick={() => {
                    navigate('/new-data')
                  }}
                >
                  New Data
                </button>
              }
              <button ref={buttonRef} className="account" onClick={handleAccountClick}>Account</button>
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