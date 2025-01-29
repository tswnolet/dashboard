import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Mobile.css';

const MobileMenu = ({ theme, scrolled, routes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const mobileRef = useRef(null);

  routes["Settings"] = "/settings";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileRef.current &&
        !mobileRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const spanStyle = {
    backgroundColor:
      theme === 'dark'
        ? `var(${scrolled ? '--secondary-color' : '--text-color'})`
        : `var(${scrolled ? '--text-color' : '--secondary-color'})`
  };

  return (
    <div className="mobile-menu-container" ref={mobileRef}>
      <label className="bar" onClick={handleToggle}>
        <span className="top" style={spanStyle}></span>
        <span className="middle" style={spanStyle}></span>
        <span className="bottom" style={spanStyle}></span>
      </label>
      <div className={`mobile-dropdown ${isOpen ? 'open' : ''}`}>
        {Object.entries(routes).map(([title, path]) => (
          <button key={title} onClick={() => {
            navigate(path);
            setIsOpen(false);
          }}>
            {title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileMenu;