import React from 'react';

const VBarChart = ({ data }) => {
    // Ensure data is always an object
    const parsedData = data && typeof data === "string" ? JSON.parse(data) : data || {};

    // If data is still empty, return a message instead of breaking
    if (!parsedData || Object.keys(parsedData).length === 0) {
        return <div className="error-message">No data available</div>;
    }

    // Convert object to array and sort by value (descending)
    let sortedEntries = Object.entries(parsedData).sort((a, b) => b[1] - a[1]);

    // Take the top 4 categories, sum the rest into "Other"
    const topCategories = sortedEntries.slice(0, 4);
    const otherSum = sortedEntries.slice(4).reduce((acc, [, value]) => acc + value, 0);

    // Construct final data structure
    const finalData = [...topCategories];
    if (otherSum > 0) {
        finalData.push(["Other", otherSum]);
    }

    // Calculate the total sum of all values
    const totalSum = finalData.reduce((acc, [, val]) => acc + val, 0) || 1; // Prevent division by zero

    return (
        <div className='vertical-graph chart'>
            {finalData.map(([category, value]) => {
                const percentage = ((value / totalSum) * 100).toFixed(2);

                return (
                    <div className='period v' key={category}>
                        <div className='graph-data-labels'>
                            <h4>{category} / {value}</h4>
                            <h4>{percentage}%</h4>
                        </div>
                        <div className="ltr-bar">
                            <div 
                                className='bar-total' 
                                style={{ width: `${percentage}%` }} 
                                title={`${category}: ${value} (${percentage}%)`}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default VBarChart;