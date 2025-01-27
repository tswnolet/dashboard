import React, { useState, useEffect } from 'react';

export const Theme = ({ theme, changeTheme }) => {
    const [isChecked, setIsChecked] = useState(theme === 'dark');
    
    useEffect(() => {
        setIsChecked(theme === 'dark');
    }, [theme]);

    return (
        <label className="switch">
            <input 
                type="checkbox" 
                onChange={changeTheme} 
                checked={isChecked}
            />
            <span className="slider"></span>
        </label>
    );
}