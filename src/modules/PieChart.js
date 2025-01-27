import React from 'react';
import '../Card.css';

const PieChartComponent = ({ data, title, formatNumber }) => {
    // Parse the data string to get the actual object
    let parsedData = {};
    try {
        parsedData = JSON.parse(data);
    } catch (error) {
        console.error("Invalid JSON format in PieChartComponent:", error);
        return <div className="error-message">Error: Invalid Data Format</div>;
    }

    const colors = ["#7b57ff", "var(--graph-color)", "#b37afa", "#d8a2f8", "#c187f9", "#f1cef9"]; // Expand as needed

    const FIXED_TOTAL = 97000;
    // Calculate the total sum of all values in parsedData
    const totalSum = Object.values(parsedData).reduce((acc, val) => acc + Number(val), 0);

    let cumulativePercentage = 0;

    const slices = Object.entries(parsedData).map(([key, value], index) => {
        const percentage = (Number(value) / (title === 'Marketing Budget' ? FIXED_TOTAL : totalSum)) * 100;
        const offset = cumulativePercentage;
        cumulativePercentage += percentage;
        return {
            name: key,
            value: value,
            percentage,
            offset: 100 - offset,
            color: colors[index % colors.length]
        };
    });

    return (
        <div className='chart-wrapper'>
            <div className="pie-legend">
                {slices.map((slice, index) => (
                    <div className="pie-legend-item" key={index}>
                        <span className="pie-legend-color" style={{ backgroundColor: slice.color }}></span>
                        <span>{slice.name} - {formatNumber(slice.value, title === 'Marketing Budget' ? "e" : 'a', title == 'Marketing Budget' ? '$' : '')}</span>
                    </div>
                ))}
            </div>
            <div className="pie-container chart">
                <svg viewBox="0 0 32 32" className="pie-chart" preserveAspectRatio="xMidYMid meet">
                    {slices.map((slice, index) => (
                        <circle
                            key={index}
                            className="pie-slice"
                            r="16"
                            cx="16"
                            cy="16"
                            stroke={slice.color}
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={`${slice.percentage} ${100 - slice.percentage}`}
                            strokeDashoffset={slice.offset}
                            transform="rotate(-90 16 16)"
                        />
                    ))}
                </svg>
                <div className="pie-text">
                    <h1>{formatNumber(totalSum)}</h1>
                    <h3 style={{ color: "var(--hover-color)" }}>{title === 'Marketing Budget' ? `/ ${formatNumber(FIXED_TOTAL)}` : ''}</h3>
                </div>
            </div>
        </div>
    );
};

export default PieChartComponent;