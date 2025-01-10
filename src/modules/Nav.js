import React, { useState, useEffect } from "react";

export default function Nav({ user, logout, title, theme, changeTheme }) {
  return (
    <nav>
      <h3 id='page-title'>{title}</h3>
      <div id='nav-actions'>
        <button onClick={changeTheme} className="theme-toggle">
            {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        <button onClick={logout} className="logout">Logout</button>
      </div>
    </nav>
  );
}