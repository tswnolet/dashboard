import { useState, useEffect } from 'react';
import { DataDisplay, SearchSelect, Subheader, SubtextTitle, Toggle } from './FieldComponents';
import { SearchBar } from './Nav';
import { Plus } from 'lucide-react';
import Modal from './Modal';

export const BillingUnbilled = () => {
    const [searchCase, setSearchCase] = useState('');
    const [setSearchName, setSetSearchName] = useState('');
    const [searchTag, setSearchTag] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [createInvoice, setCreateInvoice] = useState(false);
    const [unbilledCases, setUnbilledCases] = useState([]);

    return (
        <>
            <div className='billing unbilled'>
                <div className='unbilled-search'>
                    <div className='unbilled-search-header'>
                        <SearchBar placeholder='Search by Case Name' value={searchCase} onChange={(e) => setSearchCase(e.target.value)} expanded={true} />
                        <SearchBar placeholder='Search by Client Name' value={setSearchName} onChange={(e) => setSetSearchName(e.target.value)} expanded={true} />
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
                    <DataDisplay title='Total' value={unbilledCases?.reduce((acc, c) => c?.unbilled, 0)} type='currency' />
                    <table className='billing-table table-full'>
                        <thead>
                            <tr>
                                <th>Case</th>
                                <th>Tags</th>
                                <th>Case Type</th>
                                <th>Time</th>
                                <th>Expenses</th>
                                <th>Flat Fees</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unbilledCases.filter((c) => c.phase != 'archived' || showArchived).map((c, index) => (
                                <tr key={index}>
                                    <td>{c?.case}</td>
                                    <td>{c?.tags[0]}</td>
                                    <td>{c?.case_type}</td>
                                    <td>{c?.time}</td>
                                    <td>{c?.expenses}</td>
                                    <td>{c?.flat_fees}</td>
                                    <td>{c?.expenses + c?.flat_fees}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {createInvoice && (
                <Modal
                    onClose={() => setCreateInvoice(null)}
                    title="Create Invoice"
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
        </>
    );
};