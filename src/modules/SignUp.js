import React, { useState, useEffect } from 'react';

export default function SignUp({ formUpdate, formData }) {
    return (
        <>
            <input
                type='text'
                name='name'
                value={formData.name}
                onChange={formUpdate}
                placeholder='Full Name'
            />
            <input
                type='text'
                name='user'
                value={formData.user}
                onChange={formUpdate}
                placeholder='Email'
            />
            <input
                type='password'
                name='password'
                value={formData.password}
                onChange={formUpdate}
                placeholder='Password'
            />
            <input
                type='password'
                name='confirm_password'
                value={formData.confirm_password}
                onChange={formUpdate}
                placeholder='Confirm Password'
            />
        </>
    );
}