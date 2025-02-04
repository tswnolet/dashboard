import React from 'react';
import HBarChart from './HBarChart';
import VBarChart from './VBarChart';
import PieChartComponent from './PieChart';
import LineGraph from './LineGraph';
import '../Card.css';

const Card = ({ data, type = "", secondData, yAxisLabel, format }) => {

    const defaultGridSize = {
        "h-bar": { 
            col: typeof data.data === "object" && data.data !== null 
                ? Object.keys(data.data).length > 5 
                    ? 3
                    : Object.keys(data.data).length === 1 
                        ? 1
                        : 2
                : 2,
            row: 2
        },
        "v-bar": { col: 2, row: 2 }, 
        "pie": { col: 2, row: 2 },
        "line": { col: 2, row: 2},
        "def": { col: 1, row: 2 }
    };

    const { col, row } = defaultGridSize[type] || { col: 1, row: 1 };

    const cardStyle = {
        gridColumn: `span ${parseInt(data.col) || col}`,
        gridRow: row === "auto" ? "auto" : `span ${parseInt(data.row) || row}`,
    };

    const formatNumber = (num, approx = null, dType = '') => {
        if (!num && num !== 0) return "N/A";

        const number = parseFloat(num);

        if (approx === "e") {
            return `${dType === "$" ? '$' : ''}${number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        if (approx === "a") {
            return `${dType === "$" ? '$' : ''}${number.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        }

        if (number >= 1_000_000) {
            return `${dType === "$" ? '$' : ''}${(number / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
        } else if (number >= 1_000) {
            return `${dType === "$" ? '$' : ''}${(number / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
        }

        return `${dType === "$" ? '$' : ''}${number.toString()}`;
    };

    return (
        <div className='card' style={cardStyle}>
            <p>{data.title}</p>
            {type == "" || type == "def" ? (
                data.title === "Total Settlement"
                    ? (
                        <div className="settlement">
                            <h1>{formatNumber(data.data[1], "", "$")}</h1>
                            <h4>/ {formatNumber(data.data[0], "", "$")}</h4>
                        </div>
                    ) : <h1>{data.data}</h1>
            ) : type === 'line' ? (
                <LineGraph data={data.data} title={data.title} formatNumber={formatNumber} secondData={secondData} yAxisLabel={yAxisLabel} />
            ) : type === 'h-bar' ? (
                <HBarChart data={data.data} title={data.title} formatNumber={formatNumber} />
            ) : type === 'v-bar' ? (
                <VBarChart data={data.data} title={data.title} formatNumber={formatNumber} format={format} />
            ) : type === 'pie' ? (
                <PieChartComponent data={data.data} title={data.title} formatNumber={formatNumber} />
            ) : null}
        </div>
    );
}

export default Card;