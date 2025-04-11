import { useState, useEffect } from 'react';
import { SearchBar } from './Nav';
import { DataDisplay, Dropdown, Toggle } from './FieldComponents';
import { Plus } from 'lucide-react';

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
                    <SearchBar placeholder='Search by Case Name' value={searchCase} onChange={(e) => setSearchCase(e.target.value)} expanded={true} />
                    <Dropdown
                        options={['All', 'Editing', 'Final', 'Void', 'Paid', 'Partially Paid', 'Overdue', 'Pending Approval', 'Approved']}
                        placeholder='Invoice Status...'
                        value={status}
                        onChange={(index) => setStatus(index)} />
                    <SearchBar placeholder='Search by Tag' value={searchTag} onChange={(e) => setSearchTag(e.target.value)} expanded={true} />
                    <Toggle
                        label='Show Archived'
                        value={showArchived}
                        onChange={() => setShowArchived(prev => !prev)}
                    />
                </div>
                <button className='action tertiary' onClick={() => setCreateInvoice(true)}><Plus size={18} />Create Invoice</button>
            </div>
            <div className='billing-container'>
                <DataDisplay title='Total Outstanding' value={invoices?.reduce((acc, c) => c?.unbilled, 0)} type='currency' />
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
        </div>
    );
};