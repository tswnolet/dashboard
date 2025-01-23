import React, { useState, useEffect } from 'react';

export default function SignUp({ formUpdate, formData }) {
    const [passwordMatch, setPasswordMatch] = useState(true);

    useEffect(() => {
        setPasswordMatch(formData.password === formData.confirm_password);
    }, [formData.password, formData.confirm_password]);

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
                name='email'
                value={formData.email}
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
            {!passwordMatch && 
                <span className='password-info'>Passwords do not match!</span>
            }
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