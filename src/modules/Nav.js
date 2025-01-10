import React, { useState, useEffect } from "react";

export default function Nav({ user, logout }) {
  return (
    <nav>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}