import React, { useEffect, useState } from 'react';
import '../Alert.css';

const Alert = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`alert ${type} ${visible ? 'fade-in' : 'fade-out'}`}>
      {message}
    </div>
  );
};

export default Alert;