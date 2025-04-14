import { useState, useEffect, useRef } from 'react';
import '../styles/BillingSetup.css';
import { EllipsisVertical, X } from 'lucide-react';
import { DataTable, MiniNav, NumberInput, SearchSelect, Subheader } from './FieldComponents';
import Modal from './Modal';
import { BillingSetupInvoices } from './BillingSetupInvoices';
import { BillingSetupPayments as BillingPayments } from './BillingSetupPayments';

export const BillingSetup = () => {
    const [rateSchedule, setRateSchedule] = useState(0);
    const [editRateSchedule, setEditRateSchedule] = useState(false);
    const [newRateSchedule, setNewRateSchedule] = useState(null);
    const [rateData, setRateData] = useState({});
    const [expenseData, setExpenseData] = useState({});
    const [rateSchedules, setRateSchedules] = useState([]);
    const [timeIncrement, setTimeIncrement] = useState(0);
    const [billingNav, setBillingNav] = useState(0);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [users, setUsers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editRate, setEditRate] = useState(null);
    const [teamMemberData, setTeamMemberData] = useState({});
    const [tkClassifications, setTkClassifications] = useState([]);
    const optionRef = useRef(null);
    
    const fetchBillingRates = async () => {
        const response = await fetch('https://api.casedb.co/billing.php');
        const data = await response.json();

        if (data.success) {
            setRateSchedules(data.billing_rates);
            setTkClassifications(data.classifications);
            setTimeIncrement(data.billing_rates[rateSchedule].time_increment);
        }
    };

    const createBillingRate = async () => {    
        const response = await fetch('https://api.casedb.co/billing.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newRateSchedule['name'],
                def: newRateSchedule['def']
            })
        });
    
        const data = await response.json();
    
        if (data.success) {
            fetchBillingRates();
            setNewRateSchedule(null);
        } else {
            console.error('Failed to create billing rate:', data.message || data.error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/user.php?billing_rate=${rateSchedule + 1}&time=${new Date().getTime()}`);
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    const updateRate = async () => {
        try {
            const response = await fetch('https://api.casedb.co/billing.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: Number(editRate.id),
                    billing_rates_id: rateSchedule + 1,
                    classification_id: Number(teamMemberData.classification ?? 1),
                    rate: Number(teamMemberData.rate ?? editRate.rate),
                    timekeeper_id: teamMemberData.timekeeper_id ?? editRate.timekeeper_id
                })
            });
            const data = await response.json();
            fetchUsers();
            setEditRate(null);
            setTeamMemberData({});
            
        } catch (err) {
            console.error(err);
        }
    }

    const fetchIncrement = async () => {
        try {
            const response = await fetch('https://api.casedb.co/billing.php');
            const data = await response.json();
            if (data.success) {
                setTimeIncrement(data.billing_rates[rateSchedule].time_increment ?? 0);
            }
        } catch (error) {
            console.error("Error fetching increment:", error);
        }
    }

    const updateIncrement = async (val) => {
        try {
            const response = await fetch('https://api.casedb.co/billing.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    billing_rates_id: rateSchedule + 1,
                    time_increment: Number(val)
                })
            });
            if (response.ok) {
                setTimeIncrement(Number(val) ?? 0);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBillingRates();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                optionRef.current &&
                !optionRef.current.contains(event.target)
            ) {
                setEditRateSchedule(false);
            }
        };
    
        if (editRateSchedule) {
            document.addEventListener("mousedown", handleClickOutside);
        }
    
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [editRateSchedule]);

    useEffect(() => {
        fetchUsers();
        fetchIncrement();
    }, [rateSchedule]);

    return (
        <div className='page-container'>
            <div id="page-header">
                <h1>Billing Setup</h1>
            </div>
            <div id='template-header'>
                {screenWidth < 729 ? (
                    <select className='default-select' value={billingNav} onChange={(e) => setBillingNav(Number(e.target.value))}>
                        <option value={0}>Rates</option>
                        <option value={1}>Invoices</option>
                        <option value={2}>Payments</option>
                        <option value={3}>Codes</option>
                        <option value={4}>Email</option>
                        <option value={5}>Access</option>
                    </select>
                )  : (
                    <>
                        <h4 onClick={() => setBillingNav(0)} className={`${billingNav !== 0 ? 'in' : ''}active`}>Rates</h4>
                        <h4 onClick={() => setBillingNav(1)} className={`${billingNav !== 1 ? 'in' : ''}active`}>Invoices</h4>
                        <h4 onClick={() => setBillingNav(2)} className={`${billingNav !== 2 ? 'in' : ''}active`}>Payments</h4>
                        <h4 onClick={() => setBillingNav(3)} className={`${billingNav !== 3 ? 'in' : ''}active`}>Codes</h4>
                        <h4 onClick={() => setBillingNav(4)} className={`${billingNav !== 4 ? 'in' : ''}active`}>Email</h4>
                        <h4 onClick={() => setBillingNav(5)} className={`${billingNav !== 5 ? 'in' : ''}active`}>Access</h4>
                    </>
                )}
            </div>
            {billingNav === 0 ? (
                <div className='billing rates'>
                    <div className='rate-header'>
                        <div className='rate-schedule-selection'>
                            <select 
                                className='default-select' 
                                value={rateSchedule} 
                                onChange={(e) => setRateSchedule(Number(e.target.value))}
                            >
                                {rateSchedules.map((rate, index) => (
                                    <option key={index} value={index}>{rate.name}</option>
                                ))}
                            </select>
                            <button 
                                className='form-box alt' 
                                onClick={() => setNewRateSchedule((prev) => !prev)}
                            >
                                <X size={18} style={!newRateSchedule ? {transform: 'rotate(-45deg)'} : {}}/>
                            </button>
                            {newRateSchedule && 
                                <div className='new-rate-schedule'>
                                    <h4>Add a New Rate Schedule</h4>
                                    <div className='form-group'>
                                        <label className='subtext'>Name the New Rate Schedule</label>
                                        <input type='text' placeholder='Rate Schedule Name' value={newRateSchedule.name} onChange={(e) => setNewRateSchedule({...newRateSchedule, name: e.target.value})}/>
                                    </div>
                                    <div className='form-group'>
                                        <label className='subtext'>Create rate schedule based off of...</label>
                                        <select className='default-select' value={newRateSchedule.template} onChange={(e) => setNewRateSchedule({...newRateSchedule, template: e.target.value})}>
                                            <option value="">New blank rate schedule</option>
                                            {rateSchedules.map((rate, index) => (
                                                <option key={index} value={index}>{rate.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className='form-group alt'>
                                        <label className='subtext'>Default billing rates?</label>
                                        <input type='checkbox' hidden/>
                                        <div 
                                            className='checkbox'
                                            onClick={() => setNewRateSchedule({...newRateSchedule, def: newRateSchedule.def === 1 ? 0 : 1})}
                                        >
                                            {newRateSchedule.def === 1 ? '✓' : ''}
                                        </div>
                                    </div>
                                    <div className='create-actions'>
                                        <button className='action' onClick={createBillingRate}>Create</button>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                    <div className='rate-schedule'>
                        <div className='title'>
                            <h4>{rateSchedules[rateSchedule]?.name}</h4>
                            {Number(rateSchedules[rateSchedule]?.def) === 1 
                                ? <span className='tag caps'>Default</span>
                                : ''
                            }
                            <div className='rate-actions' ref={optionRef}>
                                <div className={`rate-action ${editRateSchedule ? 'expanded' : ''}`} onClick={() => setEditRateSchedule((prev) => !prev)}>
                                    {!editRateSchedule ? <EllipsisVertical /> : <X/>}
                                </div>
                                {editRateSchedule && 
                                    <div className='rate-action-options'>
                                        <div className='rate-action-option'>Rename</div>
                                        <div className='rate-action-option'>Set as Default</div>
                                        <div className='rate-action-option'>Remove</div>
                                    </div>
                                }
                            </div>
                        </div>
                        <div className='rate-increment'>
                            <label className='subtext alt'>Minimum Time Increment</label>
                            <select className='default-select small' value={timeIncrement} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setTimeIncrement(val);
                                    updateIncrement(val);
                                }}
                            >
                                <option value={0}>None</option>
                                <option value={1}>0.1 Hour</option>
                                <option value={2}>0.25 Hour</option>
                            </select>
                        </div>
                        <div className='instructions rate'>
                            Setting a minumum time increment will cause all entries for the billing timer and the time entry to be rounded up to the next closest time increment.
                        </div>
                        <div className='time-table'>
                            <div className='rate-time'>
                                <SearchSelect
                                    options={Object.fromEntries(users.map(user => [user.id, user.name]))}
                                    value={selectedMember}
                                    onChange={(val) => setSelectedMember(val)}
                                    placeholder='Search for a team member...'
                                />
                            </div>
                            <table className='rate-table'>
                                <thead>
                                    <tr>
                                        <th>Team Member</th>
                                        <th>Timekeeper ID</th>
                                        <th>Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(user => selectedMember ? Number(user.id) === Number(selectedMember) : user).map(user => (
                                        <tr key={user.id} onClick={() => setEditRate(user)}>
                                            <td>
                                            <span className='contact-initials'>
                                                {user.profile_picture ? (
                                                    <img src={`https://api.casedb.co/${user.profile_picture}`} />
                                                ) : (
                                                    (() => {
                                                        const parts = user.name?.trim().split(' ');
                                                        const first = parts?.[0]?.[0] || '';
                                                        const last = parts?.[parts.length - 1]?.[0] || '';
                                                        return (first + last).toUpperCase();
                                                    })()
                                                )}
                                            </span>
                                                {user.name}
                                            </td>
                                            <td>{user.timekeeper_id}</td>
                                            <td>{user.rate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {editRate &&
                                <Modal
                                    onClose={() => setEditRate(null)}
                                    title="Edit User Billing Rate"
                                    header={(
                                        <div className='modal-header-actions'>
                                            <button className='action alt' onClick={() => setEditRate(null)}>Cancel</button>
                                            <button className='action' onClick={() => updateRate()}>Save</button>
                                        </div>
                                    )}
                                >
                                     <div className='modal-content-wrapper'>
                                        <div className='user-name'>
                                        <span className='contact-initials'>
                                                    {editRate.profile_picture 
                                                    ? (
                                                        <img src={`https://api.casedb.co/${editRate.profile_picture}`}/> 
                                                    ) : (
                                                        (() => {
                                                            const parts = editRate.name?.trim().split(' ');
                                                            const first = parts?.[0]?.[0] || '';
                                                            const last = parts?.[parts.length - 1]?.[0] || '';
                                                            return (first + last).toUpperCase();
                                                        })()
                                                    )}
                                                </span>
                                            {editRate.name}
                                        </div>
                                        <div className='billing-rate-setup'>
                                            <div className='form-group'>
                                                <label className='subtext'>Timekeeper ID</label>
                                                <input type='text' placeholder='Timekeeper ID' value={teamMemberData?.timekeeper_id?.length > 0 ? teamMemberData.timekeeper_id : editRate.timekeeper_id} onChange={(e) => setTeamMemberData({ ...teamMemberData, timekeeper_id: e.target.value})}/>
                                            </div>
                                            <div className='form-group'>
                                                <label className='subtext'>Rate</label>
                                                <NumberInput type='currency' value={teamMemberData?.rate?.length > 0 ? teamMemberData.rate : editRate.rate} onChange={(val) => setTeamMemberData({ ...teamMemberData, rate: val})} />
                                            </div>
                                        </div>
                                        <div className='form-group'>
                                            <label className='subtext'>Timekeeper Classification</label>
                                            <select className='default-select' value={teamMemberData?.classification?.length > 0 ? teamMemberData.classification : editRate.classification_id} onChange={(e) => setTeamMemberData({ ...teamMemberData, classification: e.target.value})}>
                                                {tkClassifications.filter(classification => Number(classification.rate_id) === (rateSchedule + 1) || Number(classification.rate_id) === Number(rateSchedules[rateSchedule]?.settings)).map((classification) => (
                                                    <option key={classification.id} value={classification.id}>{classification.classification}</option>
                                                ))}
                                            </select>
                                        </div>
                                     </div>
                                </Modal>
                            }
                        </div>
                    </div>
                </div>
            ) : billingNav === 1 ? (
                <BillingSetupInvoices />
            ) : billingNav === 2 ? (
                <BillingPayments />
            ) : (
                <></>
            )}
        </div>
    )
}