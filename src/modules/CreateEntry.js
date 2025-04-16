import { useState, useEffect } from 'react';
import { Checkbox, Contact, DateInput, NumberInput, SearchSelect, Text, Toggle } from './FieldComponents';

export const CreateEntry = ({ users, entryData, setEntryData, rateEntries }) => {
    const [entryType, setEntryType] = useState('time');
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        setEntryData({ ...entryData, user_id: selectedUser?.id || null, billing_rate_id: rateEntries.filter(r => r.user_id === selectedUser?.id)[0]?.id ?? 0});
    }, [selectedUser]);

    return (
        <div className='modal-content-wrapper'>
            <div className='form-group mid team-member'>
                <label className='subtext'>Team Member*</label>
                <Contact
                    selectedContact={selectedUser}
                    setSelectedContact={setSelectedUser}
                    users={users}
                />
            </div>
            <div className='entry-container'>
                <div className='form-group mid'>
                    <label className='subtext'>Date*</label>
                    <DateInput
                        value={entryData.date}
                        onChange={(val) => setEntryData({ ...entryData, date: val })}
                    />
                </div>
                <div className='form-group mid'>
                    <label className='subtext'>Rate*</label>
                    <NumberInput
                        type='number'
                        value={entryData.rate ?? rateEntries.filter(r => r.user_id === selectedUser?.id)[0]?.rate ?? 0}
                        onChange={(val) => setEntryData({ ...entryData, rate: Number(val) })}
                    />
                </div>
                <div className='form-group mid'>
                    <label className='subtext'>Hours*</label>
                    <NumberInput
                        type='number'
                        value={entryData.hours}
                        onChange={(val) => setEntryData({ ...entryData, hours: Number(val) })}
                    />
                </div>
            </div>
            <div className='form-group mid'>
                <label className='subtext'>Description*</label>
                <Text
                    type='textarea'
                    value={entryData.description}
                    onChange={(val) => setEntryData({ ...entryData, description: val })}
                    placeholder='Description...'
                />
            </div>
            <Checkbox
                value={entryData.draft}
                onChange={() => setEntryData(prev => ({ ...prev, draft: !prev.draft }))}
                label='Save as Draft'
                hint='Enable to save this entry as a draft. It will not be included in the invoice.'
                space
            />
            <div className='entry-lower-container'>
                <Toggle
                    label='Billable'
                    value={entryData.billable}
                    onChange={() => setEntryData(prev => ({ ...prev, billable: !prev.billable }))}
                />
                <Toggle
                    label='Chargeable'
                    value={entryData.chargeable}
                    onChange={() => setEntryData(prev => ({ ...prev, chargeable: !prev.chargeable }))}
                />
            </div>
        </div>
    );
};