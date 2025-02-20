import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Mobile.css';

const MobileMenu = ({ theme, scrolled, routes, logout}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [displayMenu, setDisplayMenu] = useState('none');
  const menu = useRef(null);

  routes["Settings"] = "/settings";

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if(isOpen == false) {
        setDisplayMenu("flex");
    } else {
      setTimeout(() => {
        setDisplayMenu("none");
      }, 300);
    }
  };

  console.log(theme)

  const spanStyle = {
    backgroundColor:
        `var(${!scrolled ? '--text-color' : '--secondary-color'})`
  };

  return (
    <div className="mobile-menu-container" ref={menu}>
      <label className="bar">
        <input type="checkbox" id="check" onChange={handleToggle} checked={isOpen} />
        <span className="top" style={spanStyle}></span>
        <span className="middle" style={spanStyle}></span>
        <span className="bottom" style={spanStyle}></span>
      </label>
      <div className={`mobile-dropdown ${isOpen ? 'open' : ''}`} style={{display: displayMenu}}>
        {Object.entries(routes).map(([title, path]) => (
          <button key={title} onClick={() => {
            navigate(path);
            setIsOpen(false);
          }}>
            {title}
          </button>
        ))}
        <button onClick={logout} className="logout">Logout</button>
      </div>
    </div>
  );
};

export default MobileMenu;