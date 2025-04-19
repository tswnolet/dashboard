import { useState, useEffect } from 'react';
import '../styles/TimeBilling.css';
import { formatDate, formatValue, Subheader, SubtextTitle } from './FieldComponents';
import { Plus } from 'lucide-react';
import { CreatePayment } from './CreatePayment';
import Modal from './Modal';
import { BillingSettings } from './BillingSettings';
import { BillingEntries } from './BillingEntries';

export const TimeBilling = ({ case_id }) => {
    const [billingNav, setBillingNav] = useState(0);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [billingData, setBillingData] = useState([]);
    const [billingEntries, setBillingEntries] = useState([]);
    const [createInvoice, setCreateInvoice] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [createPayment, setCreatePayment] = useState(false);
    const [payment, setPayment] = useState(null);
    const [newSettings, setNewSettings] = useState({});
    const [settings, setSettings] = useState({});
    const [rateSchedule, setRateSchedule] = useState(0);
    const [rateEntries, setRateEntries] = useState([]);
    
    const fetchBillingSettings = async () => {
        const response = await fetch(`https://api.casedb.co/billing.php?settings=${case_id}`);
        const data = await response.json();

        if (data.success) {
            setRateSchedule(data?.settings?.billing_rates_id);
            setNewSettings(data.settings);
            setSettings(data.settings);
            setRateEntries(data.billing_rate_entries);
        }
    };

    const fetchBillingData = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/payments.php?case_id=${case_id}`);
            const data = await response.json();
            setBillingEntries(data);
        } catch (error) {
            console.error('Error fetching billing data:', error);
        }
    };

    const postPayment = async () => {
        payment.case_id = case_id;

        try {
            const response = await fetch(`https://api.casedb.co/payments.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payment),
            });
            const data = await response.json();
            if (data.success) {
                setCreatePayment(false);
                setPayment(null);
                fetchBillingData();
            } else {
                console.error('Error posting payment:', data.message);
            }
        } catch (error) {
            console.error('Error posting payment:', error);
        }
    };

    useEffect(() => {
        fetchBillingData();
        fetchBillingSettings();
    }, []);

    return (
        <div className='case-section'>
            <div id='template-header' className='alt-header'>
                {screenWidth < 729 ? (
                    <select className='default-select' value={billingNav} onChange={(e) => setBillingNav(Number(e.target.value))}>
                        <option value={0}>Summary</option>
                        <option value={1}>Billing Entries</option>
                        <option value={2}>Project Funds</option>
                        <option value={3}>Settings</option>
                    </select>
                )  : (
                    <>
                        <h4 onClick={() => setBillingNav(0)} className={`${billingNav !== 0 ? 'in' : ''}active`}>Summary</h4>
                        <h4 onClick={() => setBillingNav(1)} className={`${billingNav !== 1 ? 'in' : ''}active`}>Billing Entries</h4>
                        <h4 onClick={() => setBillingNav(2)} className={`${billingNav !== 2 ? 'in' : ''}active`}>Project Funds</h4>
                        <h4 onClick={() => setBillingNav(3)} className={`${billingNav !== 3 ? 'in' : ''}active`}>Settings</h4>
                    </>
                )}
            </div>
            {billingNav === 0 ? (
                <div className='billing-summary'>
                    <div className='billing-summary-details'>
                        <div className='billing-summary-totals'>
                            <SubtextTitle title='Summary' />
                            <div className='billing-invoice-totals'>
                                <span className='subtext'>
                                    Total Invoices
                                </span>
                                <span className='subtext'>
                                    {formatValue(billingData.total_invoices ? billingData.total_invoices : 0, 'currency')}
                                </span>
                            </div>
                            <div className='billing-invoice-totals'>
                                <span className='subtext'>
                                    Total Transactions
                                </span>
                                <span className='subtext'>
                                {formatValue(billingEntries?.payments?.reduce((acc, p) => acc + p?.total, 0) ? billingEntries?.payments?.reduce((acc, p) => acc + p?.total, 0) : 0, 'currency')}
                                </span>
                            </div>
                            <div className='billing-invoice-totals'>
                                <span className='subtext'>
                                    Current Balance
                                </span>
                                <span className='subtext'>
                                    {formatValue(billingData.balance ? billingData.balance : 0, 'currency')}
                                </span>
                            </div>
                        </div>
                        <div className='billing-invoices'>
                            <Subheader title='Invoices' action={<button className='action tertiary'><Plus size={18} />New Invoice</button>} />
                            <table className='billing-table table-full'>
                                <thead>
                                    <tr className='subtext'>
                                        <th>Date</th>
                                        <th>Inv. #</th>
                                        <th>Description</th>
                                        <th>Total</th>
                                        <th>Outstanding</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                    </div>
                    <div className='billing-summary-details'>
                        <div className='billing-summary-totals'>
                            <SubtextTitle title='Unbilled' />
                            <div className='billing-invoice-totals'>
                                <span className='subtext'>
                                    Time Entries
                                </span>
                                <span className='subtext'>
                                    {formatValue(billingData.time_entries ? billingData.time_entries : 0, 'currency')}
                                </span>
                            </div>
                            <div className='billing-invoice-totals'>
                                <span className='subtext'>
                                    Expenses
                                </span>
                                <span className='subtext'>
                                {formatValue(billingData.expenses ? billingData.expenses : 0, 'currency')}
                                </span>
                            </div>
                            <div className='billing-invoice-totals'>
                                <span className='subtext'>
                                    Flat Fee
                                </span>
                                <span className='subtext'>
                                    {formatValue(billingData.flat_fee ? billingData.flat_fee : 0, 'currency')}
                                </span>
                            </div>
                        </div>
                        <div className='billing-invoices'>
                            <Subheader title='Transactions' action={<button className='action tertiary' onClick={() => setCreatePayment(true)}><Plus size={18} />New Transaction</button>} />
                            <table className='billing-table table-full'>
                                <thead>
                                    <tr className='subtext'>
                                        <th>Date</th>
                                        <th>Method</th>
                                        <th>Reference #</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billingEntries?.payments?.map((payment, index) => (
                                        <tr key={index}>
                                            <td title={formatDate(payment.date)[3]}>{formatDate(payment.date)[3]}</td>
                                            <td title={payment.method}>{payment.method.length > 20 ? `${String(payment.method).slice(0, 20)}...` : payment.method}</td>
                                            <td title={payment.reference}>{payment.reference}</td>
                                            <td title={payment.total}>{formatValue(payment.total, 'currency')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : billingNav === 1 ? (
                <BillingEntries case_id={case_id} rateEntries={rateEntries} />
            ) : billingNav === 3 ? (
                <BillingSettings case_id={case_id} settings={settings} newSettings={newSettings} setNewSettings={setNewSettings} rateSchedule={rateSchedule} />
            ) : (
                <></>
            )}
            {createPayment && 
                <Modal
                    onClose={() => {
                        setCreatePayment(null);
                    }}
                    title="Payment"
                    single
                    footer={(
                        <div className='modal-footer-actions'>
                        <button
                            className='action alt'
                            onClick={() => {
                                setCreatePayment(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className='action'
                            onClick={() => {
                                postPayment();
                            }}
                        >
                            Save
                        </button>
                        </div>
                    )}
                >
                    <CreatePayment
                        payment={payment}
                        setPayment={setPayment}
                    />
                </Modal>
            }
        </div>
    );
}