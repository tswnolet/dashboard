import { useState, useEffect } from 'react';
import { formatDate, formatValue } from './FieldComponents';
import { Plus, Minus } from 'lucide-react';
import Modal from './Modal';
import { CreateEntry } from './CreateEntry';

export const BillingEntries = ({ case_id, rateEntries }) => {
    const [timeEntries, setTimeEntries] = useState([]);
    const [createEntry, setCreateEntry] = useState(null);
    const [users, setUsers] = useState([]);
    const [entryData, setEntryData] = useState({
        billing_rate_id: null,
        date: new Date().toISOString().split('T')[0],
        rate: null,
        hours: 0,
        description: '',
        user_id: null,
        case_id: case_id,
    });
    const [expandedUser, setExpandedUser] = useState(null);

    const fetchUsers = async () => {
        try {
            const response = await fetch('https://api.casedb.co/user.php?billing_rate=1');
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    const fetchTimeEntries = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/billing_entries.php?case_id=${case_id}`);
            const data = await response.json();
            if (data.success) {
                setTimeEntries(data.billing_entries);
            }
        } catch (err) {
            console.error('Failed to fetch time entries:', err);
        }
    };

    const postTimeEntry = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/billing_entries.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entryData)
            });
            const data = await response.json();
            if (data.success) {
                fetchTimeEntries();
                setEntryData({
                    billing_rate_id: null,
                    date: new Date().toISOString().split('T')[0],
                    rate: null,
                    hours: 0,
                    description: '',
                    user_id: null,
                    case_id: case_id,
                });
            }
        } catch (err) {
            console.error('Failed to post time entry:', err);
        }
    };

    const groupedByType = Object.values(
        timeEntries.reduce((acc, entry) => {
            const type = entry.item_type || 'unknown';
            if (!acc[type]) {
                acc[type] = {
                type,
                label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                total_price: 0,
                total_quantity: 0,
                total_entries: 0,
                entries: []
                };
            }

            console.log(parseFloat(entry.rate || 0) * parseFloat(entry.raw_quantity || 0));
        
            acc[type].total_price += (parseFloat(entry.rate || 0) * parseFloat(entry.raw_quantity || 0));
            acc[type].total_quantity += parseFloat(entry.raw_quantity || 0);
            acc[type].total_entries += 1;
            acc[type].entries.push(entry);
            return acc;
        }, {})
    );

    useEffect(() => {
        fetchTimeEntries();
        fetchUsers();
    }, []);

    return (
        <div className='billing-entries'>
            <button className='action alt' onClick={() => setCreateEntry(1)}>+ Time Entry</button>
            {createEntry === 1 && (
                <Modal
                    onClose={() => {
                        setCreateEntry(null);
                    }}
                    title="Add Time Entry"
                    single
                    footer={(
                        <div className='modal-footer-actions'>
                            <button
                                className='action alt'
                                onClick={() => {
                                    setCreateEntry(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className='action'
                                onClick={() => {
                                    postTimeEntry();
                                    setCreateEntry(null);
                                }}
                            >
                                Save
                            </button>
                        </div>
                    )}
                >
                    <CreateEntry users={users} entryData={entryData} setEntryData={setEntryData} rateEntries={rateEntries} />
                </Modal>
            )}
            {groupedByType.length === 0 && (
                <div className='empty-state'>No time entries yet for this case.</div>
            )}
            {groupedByType.map((group, index) => (
                <div
                    key={index}
                    className={`payment-item ${expandedUser === index ? 'expanded' : ''}`}
                    onClick={() => setExpandedUser(expandedUser === index ? null : index)}
                >
                    <div className='payment-summary'>
                        <div className='payment-details'>
                            <div className='entry-type-item'>
                                {group.type} Entries
                            </div>
                            <div className='payment-total'>
                                <span className='subtext'>
                                    {group.type === 'time'
                                        ? `Total Hours: ${group.total_quantity.toFixed(2)} hrs`
                                        : `${group.total_quantity.toFixed(2)}`}
                                </span>
                                <span className='subtext'>
                                    {group.type === 'time'
                                        ? `Total Price: ${formatValue(group.total_price, 'currency')}`
                                        : `${formatValue(group.total_price, 'currency')}`}
                                </span>
                                <span className='subtext'>
                                    {group.type === 'time'
                                        ? `Total Entries: ${group.total_entries}`
                                        : `${group.total_entries}`}
                                </span>
                                <div className='expand-icon'>
                                    {expandedUser === index ? <Minus size={14} /> : <Plus size={14} />}
                                </div>
                            </div>
                        </div>
                        {expandedUser === index && (
                            <table className='payment-details-table table-full'>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Team Member</th>
                                        <th>Rate</th>
                                        <th>Hours</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.entries.map((entry, i) => (
                                        <tr key={i}>
                                            <td>{formatDate(entry.date)[3]}</td>
                                            <td>{entry.description}</td>
                                            <td>{users.filter(user => entry.user_id === Number(user.id))[0].name}</td>
                                            <td>{entry.rate}</td>
                                            <td>{parseFloat(entry.raw_quantity).toFixed(2)}</td>
                                            <td>{formatValue(parseFloat(entry.rate) * parseFloat(entry.raw_quantity), 'currency')}</td>
                                            <td><span className='tag'>{entry.status || 'Saved'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};