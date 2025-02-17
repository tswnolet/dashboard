import React from 'react';
import '../Card.css';
import Loading from './Loading';

const PieChartComponent = ({ data, title, formatNumber, format = 'row' }) => {
    const parsedData = typeof data === "string" ? JSON.parse(data) : data;

    if (!parsedData || Object.keys(parsedData).length === 0) {
        return <Loading />;
    }

    const colors = ["#7b57ff", "var(--graph-color)", "#b37afa", "#d8a2f8", "#c187f9", "#f1cef9", "#000", "#1100ff", "var(--text-color)", "var(--hover-color)"];

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
        <div className='chart-wrapper' style={{ flexDirection: format }}>
            <div className="pie-legend" style={{ flexDirection: format === "column" ? "row" : "column" }}>
                {slices.map((slice, index) => (
                    <div className="pie-legend-item" key={index}>
                        <div className="pie-legend-color" style={{ backgroundColor: slice.color }}></div>
                        <span>{slice.name} {window.innerWidth > 1024 ? `- ${formatNumber(slice.value, title === 'Marketing Budget' || title === 'Attorney Fee Split' ? "e" : 'a', title == 'Marketing Budget' || title === 'Attorney Fee Split' ? '$' : '')}` : `${formatNumber(slice.percentage, "e")}%`}</span>
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
                    <span style={{ color: "var(--hover-color)" }}>{title === 'Marketing Budget' ? `/ ${formatNumber(FIXED_TOTAL, "e", "$")}` : ''}</span>
                </div>
            </div>
        </div>
    );
};

export default PieChartComponent;