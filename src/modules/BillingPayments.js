import { useState, useEffect } from 'react';
import { SearchBar } from './Nav';
import { DataDisplay, DateRange, Deadline, SearchSelect, Toggle } from './FieldComponents';
import Modal from './Modal';
import { Plus } from 'lucide-react';

export const BillingPayments = () => {
    const [searchCase, setSearchCase] = useState('');
    const [searchName, setSearchName] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [createPayment, setCreatePayment] = useState(false);
    const [payments, setPayments] = useState([]);
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
                    <button className='action tertiary' onClick={() => setCreatePayment(true)}><Plus size={18} />Create Payment</button>
                </div>
                <div className='billing-container'>
                    <DataDisplay title='Payments' value={payments?.reduce((acc, c) => c?.payment, 0)} type='currency' />
                    {
                        payments.filter((c) => c.phase != 'archived' || showArchived).map((c, index) => (
                            <div key={index} className={`payment-item ${expandedPayment === index ? 'expanded' : ''}`} onClick={() => setExpandedPayment(expandedPayment === index ? null : index)}>
                                <div className='payment-header'>
                                
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
            {createPayment && (
                <Modal
                    onClose={() => setCreatePayment(null)}
                    title="Create Payment"
                    single
                    footer={(
                        <div className='modal-footer-actions'>
                            <button className='action alt' onClick={() => setCreatePayment(null)}>Cancel</button>
                            <button className='action' onClick={() => {}}>Save</button>
                        </div>
                    )}
                >
                    <div className='form-group small'>
                        <label className='subtext'>Select Case</label>
                        <SearchSelect
                            options={Object.fromEntries(payments.map(user => [user?.id, user?.name]))}
                            value={expandedPayment}
                            onChange={(val) => setExpandedPayment(val)}
                            placeholder='Search for a team member...'
                        />
                    </div>
                </Modal>
            )}
        </>
    );
};