import React from 'react';
import '../Card.css';

// Card component to display data
const Card = ({ data }) => {
    const cardStyle = {
        gridColumn: `span ${parseInt(data.col) || 1}`,
        gridRow: `span ${parseInt(data.row) || 1}`
    };

    return (
        <div className="card" style={cardStyle}>
            {/* Display the value */}
            <h2>{data.data}</h2>
            {/* Display the title */}
            <p>{data.title}</p>
        </div>
    );
}

export default Card;