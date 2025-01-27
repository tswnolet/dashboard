import React from 'react';
import '../Card.css';

const PieChartComponent = ({ data, title }) => {
    const FIXED_TOTAL = 97000;
    const totalSum = Object.values(data).reduce((acc, val) => acc + val[0], 0);

    const formatNumber = (num) => {
        if (num >= 1_000_000) {
            return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (num >= 1_000) {
            return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num.toString();
    };

    let cumulativePercentage = 0;

    const slices = Object.entries(data).map(([key, value]) => {
        const percentage = (value[0] / FIXED_TOTAL) * 100;
        const offset = cumulativePercentage;
        cumulativePercentage += percentage;
        return {
            name: key,
            value: value[0],
            percentage,
            offset: 100 - offset,
            color: value[1]
        };
    });

    return (
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
                <h3 style={{ color: "var(--hover-color)" }}>/ {formatNumber(FIXED_TOTAL)}</h3>
            </div>
        </div>
    );
};

export default PieChartComponent;