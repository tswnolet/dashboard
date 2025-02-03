import React from 'react';
import { Box, Typography } from '@mui/material';
import '../Card.css';
import Loading from './Loading';

const PieChartComponent = ({ data, title, formatNumber }) => {
    const parsedData = typeof data === "string" ? JSON.parse(data) : data;

    if (!parsedData || Object.keys(parsedData).length === 0) {
        return <Loading />;
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
        <Box className='chart-wrapper'>
            <Box className="pie-legend">
                {slices.map((slice, index) => (
                    <Box className="pie-legend-item" key={index}>
                        <Box className="pie-legend-color" sx={{ backgroundColor: slice.color }}></Box>
                        <Typography variant="body2">{slice.name} {window.innerWidth > 1024 ? `- ${formatNumber(slice.value, title === 'Marketing Budget' ? "e" : 'a', title == 'Marketing Budget' ? '$' : '')}` : `${formatNumber(slice.percentage, "e")}%`}</Typography>
                    </Box>
                ))}
            </Box>
            <Box className="pie-container chart">
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
                <Box className="pie-text">
                    <Typography variant="h4">{formatNumber(totalSum)}</Typography>
                    <Typography variant="subtitle1" sx={{ color: "var(--hover-color)" }}>{title === 'Marketing Budget' ? `/ ${formatNumber(FIXED_TOTAL)}` : ''}</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default PieChartComponent;