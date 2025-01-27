import React from 'react';

const HBarChart = ({ data }) => {
    const maxTotal = Math.max(...Object.values(data).flat());

    return (
        <>
            <div className="horizontal-graph chart">
                {Object.entries(data).map(([period, values]) => {
                    const [intakeTotal, newCasesTotal] = values;
                    return (
                        <div className='period' key={period}>
                            <div 
                                className="ttb-bar intake" 
                                style={{ height: `${(intakeTotal / maxTotal) * 100}%` }}
                                title={intakeTotal}
                            ></div>
                            <div 
                                className="ttb-bar new-cases" 
                                style={{ height: `${(newCasesTotal / maxTotal) * 100}%` }}
                                title={newCasesTotal}
                            ></div>
                        </div>
                    );
                })}
            </div>
            <div className="graph-titles">
                {Object.entries(data).map(([key]) => (
                    <h4 key={key}>{key}</h4>
                ))}
            </div>
        </>
    );
}

export default HBarChart;