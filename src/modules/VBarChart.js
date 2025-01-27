import React from 'react';

const VBarChart = ({ data }) => {
    const totalSum = Object.values(data).reduce((acc, val) => acc + val, 0);

    return (
        <div className='vertical-graph chart'>
            {Object.entries(data).map(([period, value]) => (
                <div className='period v' key={period}>
                    <div className='graph-data-labels'>
                        <h4>{period}</h4>
                        <h4>{((value / totalSum) * 100).toFixed(2)}%</h4>
                    </div>
                    <div className="ltr-bar">
                        <div className='bar-total' style={{ width: `${(value / totalSum) * 100}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default VBarChart;