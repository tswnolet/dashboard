import { useState, useEffect } from 'react';
import { Instructions, MiniNav, Subheader, Toggle } from './FieldComponents';
import { Download, Plus } from 'lucide-react';

export const BillingInvoices = () => {
    const [miniNavSelected, setMiniNavSelected] = useState(0);
    const [roles, setRoles] = useState([]);
    const [iGSettings, setIGSettings] = useState({
        invoiceGenerationEnabled: false,
        invoiceApprovalEnabled: false,
        invoiceApprovalRequired: false,
    });

    const fetchRoles = async () => {
        try {
            const response = await fetch('https://api.casedb.co/roles.php');
            const data = await response.json();
            setRoles(data.roles);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    }

    useEffect(() => {
        fetchRoles();
    }, []);

    return (
        <div className='billing invoices'>
            <MiniNav
                options={['Invoice Template', 'LEDES Settings', 'Invoice Generation Settings', 'Invoice Approval']}
                selectedOption={miniNavSelected}
                setSelectedOption={setMiniNavSelected}
            />
            <div className='invoices-container'>
                {miniNavSelected === 0 ? (
                    <>
                        <div className='form-group'>
                            <label className='subtext'>Default Template *</label>
                            <select className='default-select small' value={0}>
                                <option value={0}>Default</option>
                                <option value={1}>Custom</option>
                            </select>
                        </div>
                        <Subheader title='Templates' action={<button className='action tertiary'><Plus />New Template</button>} />
                        <table className='invoice-template-table'>
                            <thead>
                                <tr>
                                    <th>Template Name</th>
                                    <th>Description</th>
                                    <th>Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Filevine Base Template</td>
                                    <td>A simple template provided by Filevine</td>
                                    <td><Download size={16} /></td>
                                </tr>
                            </tbody>
                        </table>
                        <Instructions instructions='Unless another template is selected at the case level, the default template will be used.' />
                    </>
                ) : miniNavSelected === 1 ? (
                    <>
                        <div className='form-group'>
                            <label className='subtext'>Law Firm ID</label>
                            <input type='text' className='small' placeholder='Law Firm ID' />
                        </div>
                    </>
                ) : miniNavSelected === 2 ? (
                    <>
                        <Subheader title='Invoice Generation Settings' />
                        <Toggle value={iGSettings.invoiceGenerationEnabled} onChange={(val) => setIGSettings({ ...iGSettings, invoiceGenerationEnabled: val })} label='Save all invoice PDFs to selected project' />
                        <Instructions instructions='When enabled, all generated invoice PDFs will be saved in the docs section of the selected case, rather than their own case.' />
                    </>
                ) : miniNavSelected === 3 && (
                    <>
                        <Subheader title='Invoice Approval' />
                        <Instructions instructions='Invoice approval is an optional first approver on an invoice approval route that has flexible responsibilities.' />
                        <Instructions instructions='Select an existing role to designate as the Invoice Approver.' />
                        <div className='form-group'>
                            <label className='subtext'>Invoice Approver</label>
                            <select className='default-select small' value={0}>
                                <option value={0}>Select a role</option>
                                {roles.map((role, index) => (
                                    <option key={index} value={role.id}>{role.role}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}