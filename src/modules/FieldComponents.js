import React, { useState, useEffect } from "react";
import '../styles/LayoutEditor.css';
import { Ar } from "@mynaui/icons-react";

export const Text = ({ type, placeholder, value }) => {
    if(type === 'text') {
        return <input type='text' placeholder={`${placeholder}...`} value={value} />;
    } else if(type === 'textarea') {
        return <textarea placeholder={`${placeholder}...`} value={value} />;
    }
}

export const Dropdown = ({ options, value }) => {
    console.log(options);
    options = options ? JSON.parse(options) : [];
    return (
        <select className='default-select' value={value}>
            {options.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    );
}