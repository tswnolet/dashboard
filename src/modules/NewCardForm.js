import React, { useState } from 'react';
import '../styles/NewCardForm.css';

const NewCardForm = ({ addCard }) => {
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    col: 1,
    row: 1,
    startDate: '',
    endDate: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        addCard(result.data);
        setFormData({
          title: '',
          value: '',
          col: 1,
          row: 1,
          startDate: '',
          endDate: ''
        });
      } else {
        console.error('Error adding card:', result.error);
      }
    } catch (error) {
      console.error('Error adding card:', error);
    }
  };

  return (
    <div className='page-container'>
        <form id='new-data-form' className='section' onSubmit={handleSubmit}>
        <label>
            Title:
            <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                required
            />
        </label>
        <label>
            Data:
            <input
                type="text"
                name="value"
                placeholder="Data"
                value={formData.value}
                onChange={handleChange}
                required
            />
        </label>
        <label>
            Columns to Span:
            <input
                type="number"
                name="col"
                placeholder="Column"
                value={formData.col}
                onChange={handleChange}
                required
            />
        </label>
        <label>
            Rows to Span:
            <input
                type="number"
                name="row"
                placeholder="Row"
                value={formData.row}
                onChange={handleChange}
                required
            />
        </label>
        <label>
            Start Date:
            <input
                type="date"
                name="startDate"
                placeholder="Start Date"
                value={formData.startDate}
                onChange={handleChange}
                required
            />
        </label>
        <label>
            End Date:
            <input
                type="date"
                name="endDate"
                placeholder="End Date"
                value={formData.endDate}
                onChange={handleChange}
                required
            />
        </label>
        <button type="submit">Add Data</button>
        </form>
    </div>
  );
};

export default NewCardForm;
