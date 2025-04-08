import { useState, useEffect, useRef } from 'react';
import '../styles/BillingSetup.css';
import { EllipsisVertical, X } from 'lucide-react';
import { SearchSelect } from './FieldComponents';
import Modal from './Modal';

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
    const optionRef = useRef(null);

    const fetchBillingRates = async () => {
        const response = await fetch('https://api.casedb.co/billing.php');
        const data = await response.json();

        if (data.success) setRateSchedules(data.billing_rates);
    }

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
            const response = await fetch(`https://api.casedb.co/user.php?rates=true&time=${new Date().getTime()}`);
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
                    ...teamMemberData
                })
            });
            const data = await response.json();
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        fetchBillingRates();
        fetchUsers();
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
                                onChange={(e) => setRateSchedule(e.target.value)}
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
                            <select className='default-select small' value={timeIncrement} onChange={(e) => setTimeIncrement(e.target.value)}>
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
                                <SearchSelect options={users.map(user => user.name)} value={selectedMember} onChange={(val) => setSelectedMember(val)}/>
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
                                    {users.map(user => (
                                        <tr key={user.id} onClick={() => setEditRate(user.id)}>
                                            <td>
                                                <span className='contact-initials'>
                                                    {user.profile_picture 
                                                        ? <img src={`https://api.casedb.co/${user.profile_picture}`}/> 
                                                        : 'TH'
                                                        }
                                                </span>
                                                {user.name}
                                            </td>
                                            <td>{user.user}</td>
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
                                            <button className='action' onClick={() => {}}>Save</button>
                                        </div>
                                    )}
                                >
                                     <div className='modal-content-wrapper'>
                                        
                                     </div>
                                </Modal>
                            }
                        </div>
                    </div>
                </div>
            ) : (
                <></>
            )}
        </div>
    )
}