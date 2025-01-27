import React from 'react';
import HBarChart from './HBarChart';
import VBarChart from './VBarChart';
import PieChartComponent from './PieChart';
import '../Card.css';

// Card component to display data
const Card = ({ data, type }) => {
    const cardStyle = {
        gridColumn: `span ${parseInt(data.col) || 1}`,
        gridRow: `span ${parseInt(data.row) || 1}`
    };

    return (
        <div className='card' style={cardStyle}>
            <p>{data.title}</p>
            {!type ? (
                <h2>{data.data}</h2>
            ) : type === 'h-bar' ? (
                <HBarChart data={data.data} />
            ) : type === 'v-bar' ? (
                <VBarChart data={data.data} />
            ) : type === 'pie' ? (
                <PieChartComponent data={data.data} />
            ) : null}
        </div>
    );
}

export default Card;