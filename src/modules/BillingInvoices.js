import { useState, useEffect } from 'react';
import { SearchBar } from './Nav';
import { DataDisplay, Dropdown, SearchSelect, Toggle } from './FieldComponents';
import { Plus } from 'lucide-react';
import Modal from './Modal';

export const BillingInvoices = () => {
    const [searchCase, setSearchCase] = useState('');
    const [searchTag, setSearchTag] = useState('');
    const [status, setStatus] = useState(0);
    const [showArchived, setShowArchived] = useState(false);
    const [createInvoice, setCreateInvoice] = useState(false);
    const [invoices, setInvoices] = useState([]);

    return (
        <div className='billing invoices'>
            <div className='invoices-search'>
                <div className='unbilled-search-header'>
                    <SearchBar placeholder='Case Name...' title='Search by Case Name' setSearchQuery={(val) => setSearchCase(val)} expanded={true} />
                    <Dropdown
                        options={['All', 'Editing', 'Final', 'Void', 'Paid', 'Partially Paid', 'Overdue', 'Pending Approval', 'Approved']}
                        placeholder='Invoice Status...'
                        value={status}
                        onChange={(index) => setStatus(index)}
                    />
                    <SearchBar placeholder='Tag...' title='Search by Tag' setSearchQuery={(val) => setSearchTag(val)} expanded={true} />
                    <Toggle
                        label='Show Archived'
                        value={showArchived}
                        onChange={() => setShowArchived(prev => !prev)}
                    />
                </div>
                <button className='action tertiary' onClick={() => setCreateInvoice(true)}><Plus size={18} />Create Invoice</button>
            </div>
            <div className='billing-container'>
                <DataDisplay title='Total Outstanding' value={invoices?.reduce((acc, i) => i?.payment === null, 0)} type='currency' />
                <table className='billing-table table-full'>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Case Name</th>
                            <th>Case Type</th>
                            <th>Tags</th>
                            <th>Invoice #</th>
                            <th>Description</th>
                            <th>Total Outstanding</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.filter((i) => i.phase != 'archived' || showArchived).map((i, index) => (
                            <tr key={index}>
                                <td>{i?.case}</td>
                                <td>{i?.tags[0]}</td>
                                <td>{i?.case_type}</td>
                                <td>{i?.time}</td>
                                <td>{i?.expenses}</td>
                                <td>{i?.flat_fees}</td>
                                <td>{i?.expenses + i?.flat_fees}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {createInvoice && (
                <Modal
                    onClose={() => setCreateInvoice(null)}
                    title="Create Invoice"
                    single
                    footer={(
                        <div className='modal-footer-actions'>
                            <button className='action alt' onClick={() => setCreateInvoice(null)}>Cancel</button>
                            <button className='action' onClick={() => {}}>Save</button>
                        </div>
                    )}
                >
                    <div className='form-group small'>
                        <label className='subtext'>Select Case</label>
                        <SearchSelect />
                    </div>
                </Modal>
            )}
        </div>
    );
};