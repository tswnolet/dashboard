import { useState, useEffect } from 'react';
import { SearchBar } from './Nav';
import { DataDisplay, DateInput, DateRange, Deadline, formatDate, formatValue, NumberInput, SearchSelect, Text, Toggle } from './FieldComponents';
import Modal from './Modal';
import { Minus, Plus } from 'lucide-react';
import { CreatePayment } from './CreatePayment';

export const BillingPayments = ({ cases }) => {
    const [searchCase, setSearchCase] = useState('');
    const [searchName, setSearchName] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [createPayment, setCreatePayment] = useState(false);
    const [payments, setPayments] = useState([]);
    const [payment, setPayment] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);
    const [expandedPayment, setExpandedPayment] = useState(null);

    const fetchPayments = async () => {
        try {
            const response = await fetch('https://api.casedb.co/payments.php');
            const data = await response.json();
            setPayments(data.payments);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const postPayment = async () => {
        payment.case_id = selectedCase;

        try {
            const response = await fetch('https://api.casedb.co/payments.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payment)
            });
            const data = await response.json();
            fetchPayments();
            setPayment(null);
        } catch (error) {
            console.error('Error posting payment:', error);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    return (
        <>
            <div className='billing payments'>
                <div className='payments-search'>
                    <div className='payments-search-header'>
                        <SearchBar placeholder='Case Name...' title='Search by Case Name' setSearchQuery={(val) => setSearchCase(val)} expanded={true} />
                        <SearchBar placeholder='Name or @username...' title='Search by Name or @username' setSearchQuery={(val) => setSearchName(val)}  expanded={true} />
                        <DateRange title='Payment Date' />
                        <Toggle
                            label='Show Archived'
                            value={showArchived}
                            onChange={() => setShowArchived(prev => !prev)}
                        />
                    </div>
                    <button className='action tertiary' onClick={() => setCreatePayment(1)}><Plus size={18} />Create Payment</button>
                </div>
                <div className='billing-container'>
                    <DataDisplay title='Payments' value={payments?.reduce((acc, p) => acc + Number(p?.total || 0), 0)} type='currency' />
                    {Object.values(
                        payments.reduce((acc, p) => {
                            const caseId = Number(p.case_id);
                            const existing = acc[caseId] || {
                                case_id: caseId,
                                total: 0,
                                payments: [],
                                method: p.method,
                                date: p.date,
                                reference: p.reference,
                                status: p.status,
                            };
                            existing.total += Number(p.total || 0);
                            existing.payments.push(p);
                            acc[caseId] = existing;
                            return acc;
                        }, {})
                    ).map((p, index) => (
                        <div
                            key={index}
                            className={`payment-item ${expandedPayment === index ? 'expanded' : ''}`}
                            onClick={() => setExpandedPayment(expandedPayment === index ? null : index)}
                        >
                            <div className='payment-summary'>
                                <div className='payment-details'>
                                    {cases.filter((c1) => Number(c1.case_id) === p.case_id).map((caseItem, index) => (
                                        <div className='case-name-item' key={index}>
                                            {caseItem.contact_display.includes('uploads') 
                                                ? <img className='contact-initials' src={`https://api.casedb.co/${caseItem.contact_display}`} alt={caseItem.contact_display} /> 
                                                : caseItem.contact_display}
                                            {caseItem.case_name}
                                        </div>
                                    ))}
                                    <div className='payment-total'>
                                        <span className='subtext'>{formatValue(p.total, 'currency')}</span>
                                        <div className='expand-icon'>
                                            {expandedPayment === index ? <Minus size={14} /> : <Plus size={14} />}
                                        </div>
                                    </div>
                                </div>
                                {expandedPayment === index && (
                                    <table className='payment-details-table table-full'>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Method</th>
                                                <th>Reference #</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.filter((p1) => Number(p1.case_id) === p.case_id).map((payment, index) => (
                                                <tr key={index}>
                                                    <td>{formatDate(payment.date)[3]}</td>
                                                    <td>{payment.method}</td>
                                                    <td>{payment.reference ?? '(blank)'}</td>
                                                    <td>{formatValue(payment.total, 'currency')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {createPayment === 1 ? (
                <Modal
                    onClose={() => {
                        setCreatePayment(null);
                        setSelectedCase(null);
                    }}
                    title="Create Payment"
                    single
                    footer={(
                        <div className='modal-footer-actions'>
                            <button
                                className='action alt'
                                onClick={() => {
                                    setCreatePayment(null);
                                    setSelectedCase(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className='action' 
                                onClick={() => setCreatePayment(2)}
                            >
                                Save
                            </button>
                        </div>
                    )}
                >
                    <div className='form-group small'>
                        <label className='subtext'>Select Case</label>
                        <SearchSelect
                            options={Object.fromEntries(cases.map(c => [c?.case_id, c?.case_name]))}
                            value={selectedCase}
                            onChange={(val) => setSelectedCase(val)}
                            placeholder='Search for a team member...'
                        />
                    </div>
                </Modal>
            ) : createPayment === 2 && (
                <Modal
                    onClose={() => {
                        setCreatePayment(null);
                        setSelectedCase(null);
                    }}
                    title="Payment"
                    single
                    contact_title={cases.find(c => c.case_id === (selectedCase ?? expandedPayment))}
                    footer={(
                        <div className='modal-footer-actions'>
                            <button
                                className='action alt'
                                onClick={() => {
                                setCreatePayment(null);
                                setSelectedCase(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className='action'
                                onClick={() => {
                                postPayment();
                                setCreatePayment(null);
                                setSelectedCase(null);
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
                        cases={cases}
                        case_id={selectedCase ?? expandedPayment}
                        onClose={() => {
                            setCreatePayment(null);
                            setSelectedCase(null);
                        }}
                        onSave={() => {
                            postPayment();
                            setCreatePayment(null);
                            setSelectedCase(null);
                        }}
                    />
                </Modal>
            )}
        </>
    );
};