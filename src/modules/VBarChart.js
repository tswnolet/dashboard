import React from 'react';

const VBarChart = ({ data }) => {
    // Safely parse the JSON data
    let parsedData = {};
    try {
        parsedData = JSON.parse(data);
    } catch (error) {
        console.error("Invalid JSON in VBarChart:", error);
        return <div className="error-message">Error: Invalid Data Format</div>;
    }

    // Calculate the total sum of all values
    const totalSum = Object.values(parsedData).reduce((acc, val) => acc + val, 0);

    return (
        <div className='vertical-graph chart'>
            {/* Iterate through parsed data */}
            {Object.entries(parsedData).map(([category, value]) => {
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
                                style={{ width: `${percentage}%` }} // Scale by total sum
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