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

    const formatNumber = (num, approx = null, type = '') => {
        if (!num && num !== 0) return "N/A";
    
        const number = parseFloat(num);
    
        if (approx === "e") {
            return `${type === "$" ? '$' : ''}${number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    
        if (approx === "a") {
            return `${type === "$" ? '$' : ''}${number.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        }
    
        if (number >= 1_000_000) {
            return `${type === "$" ? '$' : ''}${(number / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
        } else if (number >= 1_000) {
            return `${type === "$" ? '$' : ''}${(number / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
        }
    
        return `${type === "$" ? '$' : ''}${number.toString()}`;
    };

    return (
        <div className='card' style={cardStyle}>
            <p>{data.title}</p>
            {!type ? (
                <h1>{formatNumber(data.data, null, "$")}</h1>
            ) : type === 'h-bar' ? (
                <HBarChart data={data.data} title={data.title} formatNumber={formatNumber} />
            ) : type === 'v-bar' ? (
                <VBarChart data={data.data} title={data.title} formatNumber={formatNumber} />
            ) : type === 'pie' ? (
                <PieChartComponent data={data.data} title={data.title} formatNumber={formatNumber} />
            ) : null}
        </div>
    );
}

export default Card;