import React from 'react';
import HBarChart from './HBarChart';
import VBarChart from './VBarChart';
import PieChartComponent from './PieChart';
import LineGraph from './LineGraph';
import '../Card.css';

// Card component to display data
const Card = ({ data, type, secondData, yAxisLabel }) => {
    // Set default grid sizes based on type
    const defaultGridSize = {
        "h-bar": { col: 3, row: 2 },
        "v-bar": { col: 2, row: 2 }, // Auto height based on content
        "pie": { col: 2, row: 2 },
        "line": { col: 2, row: 2}
    };

    const { col, row } = defaultGridSize[type] || { col: 1, row: 1 };

    const cardStyle = {
        gridColumn: `span ${parseInt(data.col) || col}`,
        gridRow: row === "auto" ? "auto" : `span ${parseInt(data.row) || row}`,
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
                data.title === "Total Adjusted Settlement Value"
                    ? <h1>{formatNumber(data.data, "e", "$")}</h1>
                    : <h1>{data.data}</h1>
            ) : type === 'line' ? (
                <LineGraph data={data.data} title={data.title} formatNumber={formatNumber} secondData={secondData} yAxisLabel={yAxisLabel} />
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