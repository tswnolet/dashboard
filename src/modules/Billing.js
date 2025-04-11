import { useState, useEffect } from 'react';
import { BillingUnbilled } from './BillingUnbilled';
import { BillingInvoices } from './BillingInvoices';

export const Billing = () => {
    const [billingNav, setBillingNav] = useState(0);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    const handleResize = () => {
        setScreenWidth(window.innerWidth);
    }

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    return (
        <div className='page-container'>
            <div id="page-header">
                <h1>Billing</h1>
            </div>
            <div id='template-header'>
                {screenWidth < 729 ? (
                    <select className='default-select' value={billingNav} onChange={(e) => setBillingNav(Number(e.target.value))}>
                        <option value={0}>Unbilled</option>
                        <option value={1}>Invoices</option>
                        <option value={2}>Payments</option>
                    </select>
                )  : (
                    <>
                        <h4 onClick={() => setBillingNav(0)} className={`${billingNav !== 0 ? 'in' : ''}active`}>Unbilled</h4>
                        <h4 onClick={() => setBillingNav(1)} className={`${billingNav !== 1 ? 'in' : ''}active`}>Invoices</h4>
                        <h4 onClick={() => setBillingNav(2)} className={`${billingNav !== 2 ? 'in' : ''}active`}>Payments</h4>
                    </>
                )}
            </div>
            {billingNav === 0 && <BillingUnbilled />}
            {billingNav === 1 && <BillingInvoices />}
            {/*billingNav === 2 && <BillingPayments />*/}
        </div>
    )
}