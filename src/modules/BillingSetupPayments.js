import { useState, useEffect } from 'react';
import { BankAccountLink, Checkbox, Instructions, Subheader, SubtextTitle } from './FieldComponents';
import { Plus } from 'lucide-react';

export const BillingSetupPayments = () => {
    const [paymentChecks, setPaymentChecks] = useState({});
    return (
        <div className='billing payments'>
            <Subheader title='Case Payment Settings' />
            <div className='payment-settings-container'>
                <Checkbox
                    value={paymentChecks.applyPayments}
                    onChange={() => setPaymentChecks(prev => ({ ...prev, applyPayments: !prev.applyPayments }))}
                    label='Automatically apply payments'
                    hint='Apply payments to invoices automatically, starting with the oldest unpaid invoice.'
                />
                <div className='checkbox-container'>
                    <Checkbox
                        value={paymentChecks.caseFunding}
                        onChange={() => setPaymentChecks(prev => ({ ...prev, caseFunding: !prev.caseFunding }))}
                        label='Automatically create payments from case funds'
                    />
                    <Checkbox
                        value={paymentChecks.invoiceFinalized}
                        onChange={() => setPaymentChecks(prev => ({ ...prev, invoiceFinalized: !prev.invoiceFinalized }))}
                        label='When an invoice is finalized'
                        hint='Automatically create a payment sourced from case funds when an invoice is finalized.'
                    />
                    <Checkbox
                        value={paymentChecks.invoiceFinalized}
                        onChange={() => setPaymentChecks(prev => ({ ...prev, invoiceFinalized: !prev.invoiceFinalized }))}
                        label='When money is added into case funds and there is a positive current balance'
                        hint="Automatically create a payment sourced from case funds when money is added if the case's (Total Invoiced) - (Total Payments) > $0"
                    />
                </div>
            </div>
            <Subheader title='Default Deposit Destinations' />
            <Instructions limited instructions='The selected accounts will be used to assign deposit destination accounts to new cases. The individual case selections can be updated inside the case Billing Section -> Settings tab.' />
            <SubtextTitle title='Invoicing' />
            <Instructions instructions='Payments made via invoice-specific payment links will be deposited into the below account.' />
            <BankAccountLink />
            <SubtextTitle title='Case Funds' />
            <Instructions instructions='Payments made via case-funds-specific payment links will be deposited into the below account.' />
            <BankAccountLink />
            <div className='payment-template-container'>
                <Subheader title='Invoice Terms' small action={<button className='action tertiary'><Plus />Invoice Terms</button>} />
                <table className='billing-template-table table-half'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Due in Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Net30</td>
                            <td>30</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};