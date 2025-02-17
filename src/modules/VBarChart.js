import React from 'react';
import Loading from './Loading';

const VBarChart = ({ data, formatNumber, format, slice = null }) => {
    const parsedData = data && typeof data === "string" ? JSON.parse(data) : data || {};

    if (!parsedData || Object.keys(parsedData).length === 0) {
        return <Loading />;
    }

    let sortedEntries = Object.entries(parsedData).sort((a, b) => b[1] - a[1]);

    const topCategories = sortedEntries.slice(0, slice || 10);
    const otherSum = sortedEntries.slice(slice || 10).reduce((acc, [, value]) => acc + value, 0);

    const finalData = [...topCategories];
    if (otherSum > 0) {
        finalData.push(["Other", otherSum]);
    }

    const totalSum = finalData.reduce((acc, [, val]) => acc + val, 0) || 1;

    return (
        <div className='vertical-graph chart'>
            {finalData.map(([category, value]) => {
                const percentage = ((value / totalSum) * 100).toFixed(2);

                return (
                    <div className='v' key={category}>
                        <div className='graph-data-labels'>
                            <h4>{category} / {format ? formatNumber(value, "e", "$") : value}</h4>
                            <h4>{percentage}%</h4>
                        </div>
                        <div className="ltr-bar">
                            <div style={{width: `${percentage}%`}} className='bar-total' title={`${category}: ${value} (${percentage}%)`}/>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default VBarChart;