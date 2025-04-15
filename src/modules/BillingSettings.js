import { useState, useEffect } from 'react';
import { BankAccountLink, Dropdown, Instructions, SearchSelect, Subheader, SubtextTitle, Text } from './FieldComponents';

export const BillingSettings = ({ case_id }) => {
    const [rateSchedules, setRateSchedules] = useState([]);
    const [rateSchedule, setRateSchedule] = useState(0);
    const [newSettings, setNewSettings] = useState({});
    const [settings, setSettings] = useState({});
    
    const fetchBillingSettings = async () => {
        const response = await fetch(`https://api.casedb.co/billing.php?settings=${case_id}`);
        const data = await response.json();

        if (data.success) {
            setRateSchedule(data.settings.billing_rates_id);
            setNewSettings(data.settings);
            setSettings(data.settings);
        }
    };

    const fetchBillingRates = async () => {
        const response = await fetch('https://api.casedb.co/billing.php');
        const data = await response.json();

        if (data.success) {
            setRateSchedules(data.billing_rates);
        }
    };

    const saveBillingSettings = async () => {
        const response = await fetch(`https://api.casedb.co/billing.php?settings=${case_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newSettings)
        });
        const data = await response.json();

        if (data.success) {
            fetchBillingRates();
            fetchBillingSettings();
        }
    }

    const handleClear = () => {
        setNewSettings(settings);
    }

    useEffect(() => {
        fetchBillingRates();
        fetchBillingSettings();
    }, []);

    return (
        <div className='billing-settings'>
            <div className='action-header'>
                <button className='action alt' disabled={newSettings == settings} onClick={handleClear}>Cancel</button>
                <button className='action primary' disabled={newSettings == settings} onClick={saveBillingSettings}>Save</button>
            </div>
            <div className='form-group'>
                <label className='subtext'>Rate Schedule</label>
                <SearchSelect
                    options={Object.fromEntries(rateSchedules.map(rate => [rate?.id, rate?.name]))}
                    value={newSettings.billing_rates_id ?? rateSchedule}
                    onChange={(val) => {
                        setNewSettings({ ...newSettings, billing_rates_id: val });
                    }}
                />
            </div>
            <div className='form-group'>
                <label className='subtext'>Invoice Terms</label>
                <Dropdown options={['Net 30']} value={newSettings.invoice_terms ?? settings.invoice_terms} onChange={(val) => setNewSettings({ ...newSettings, invoice_terms: val })} />
            </div>
            <div className='form-group'>
                <label className='subtext'>Client Matter ID</label>
                <Text type='text' value={newSettings.client_matter_id ?? settings.client_matter_id} onChange={(val) => setNewSettings({ ...newSettings, client_matter_id: val })} placeholder='Client Matter ID...' />
            </div>
            <Subheader title='Invoice Template' />
            <Instructions instructions="Choose the invoice template to be used for this case's PDFs." />
            <Dropdown options={['Filevine Base Template']} value={newSettings.invoice_template ?? settings.invoice_template} onChange={(val) => setNewSettings({ ...newSettings, invoice_template: val })} />
            <Subheader title='Deposit Destination' />
            <SubtextTitle title='Invoicing' />
            <Instructions instructions="Payments made via invoice-specific payment links will be deposited into this account." />
            <BankAccountLink />
            <SubtextTitle title='Case Funds' />
            <Instructions instructions="Payments made via case-funds-specific payment links will be deposited into this account." />
            <BankAccountLink />
        </div>
    );
}