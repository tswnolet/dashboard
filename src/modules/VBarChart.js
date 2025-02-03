import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import Loading from './Loading';

const VBarChart = ({ data, formatNumber, format }) => {
    const parsedData = data && typeof data === "string" ? JSON.parse(data) : data || {};

    if (!parsedData || Object.keys(parsedData).length === 0) {
        return <Loading />;
    }

    let sortedEntries = Object.entries(parsedData).sort((a, b) => b[1] - a[1]);

    const topCategories = sortedEntries.slice(0, 4);
    const otherSum = sortedEntries.slice(4).reduce((acc, [, value]) => acc + value, 0);

    const finalData = [...topCategories];
    if (otherSum > 0) {
        finalData.push(["Other", otherSum]);
    }

    const totalSum = finalData.reduce((acc, [, val]) => acc + val, 0) || 1;

    return (
        <Box className='vertical-graph chart'>
            {finalData.map(([category, value]) => {
                const percentage = ((value / totalSum) * 100).toFixed(2);

                return (
                    <Box className='period v' key={category} sx={{ mb: 2 }}>
                        <Box className='graph-data-labels' sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6">{category} / {format ? formatNumber(value, "e", "$") : value}</Typography>
                            <Typography variant="h6">{percentage}%</Typography>
                        </Box>
                        <Box className="ltr-bar" sx={{ mt: 1 }}>
                            <LinearProgress 
                                variant="determinate" 
                                value={percentage} 
                                sx={{ height: 10, borderRadius: 5 }} 
                                title={`${category}: ${value} (${percentage}%)`}
                            />
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}

export default VBarChart;