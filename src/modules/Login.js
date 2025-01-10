import React, { useState, useEffect } from 'react';

export default function Login({ formUpdate, formData }) {
    return (
        <>
            <input
                type='text'
                name='user'
                value={formData.user}
                onChange={formUpdate}
                placeholder='Username or Email'
            />
            <input
                type='password'
                name='password'
                value={formData.password}
                onChange={formUpdate}
                placeholder='Password'
            />
        </>
    );
}