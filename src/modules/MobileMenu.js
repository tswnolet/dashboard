import React, { useState } from 'react';
import '../Mobile.css';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <label className="bar">
        <input type="checkbox" id="check" onChange={handleToggle} checked={isOpen} />
        <span className="top"></span>
        <span className="middle"></span>
        <span className="bottom"></span>
    </label>
  );
};

export default MobileMenu;