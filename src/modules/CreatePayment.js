import { DateInput, NumberInput, Text } from './FieldComponents';

export const CreatePayment = ({
    payment,
    setPayment
}) => {
    return (
        <div className='modal-content-wrapper'>
            <div className='form-group alt mid'>
                <label className='subtext'>Reference #</label>
                <Text
                    type='text'
                    placeholder='Reference #'
                    value={payment?.reference}
                    onChange={(val) => setPayment({ ...payment, reference: val })}
                />
            </div>
            <div className='form-group alt mid'>
                <label className='subtext'>Date</label>
                <DateInput
                    value={payment?.date}
                    onChange={(val) => setPayment({ ...payment, date: val })}
                />
            </div>
            <div className='form-group alt mid'>
                <label className='subtext'>Total*</label>
                <NumberInput
                    type='currency'
                    value={payment?.total}
                    onChange={(val) => setPayment({ ...payment, total: val })}
                />
            </div>
            <div className='form-group alt mid'>
                <label className='subtext'>Method*</label>
                <Text
                    type='text'
                    placeholder='Method*'
                    value={payment?.method}
                    onChange={(val) => setPayment({ ...payment, method: val })}
                />
            </div>
        </div>
    );
};