import React from 'react';

const HBarChart = ({ data }) => {
    // Parse the data into an object
    const parsedData = JSON.parse(data);

    // Define the chronological order of months
    const monthOrder = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Sort the data by month order
    const sortedEntries = Object.entries(parsedData).sort(
        ([a], [b]) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );

    // Get the maximum total to scale the bars
    const maxTotal = Math.max(...Object.values(parsedData).flat());

    return (
        <>
            <div className="horizontal-graph chart">
                {/* Iterate through sorted data */}
                {sortedEntries.map(([month, values]) => {
                    const [intakeTotal, newCasesTotal] = values; // Destructure the values
                    return (
                        <div className="period" key={month}>
                            <div className='graph-bars'>
                                {/* Intake Bar */}
                                <div 
                                    className="ttb-bar intake" 
                                    style={{ height: `${(intakeTotal / maxTotal) * 100}%` }} // Scale by maxTotal
                                    title={`Intake: ${intakeTotal}`}
                                ></div>
                                {/* New Cases Bar */}
                                <div 
                                    className="ttb-bar new-cases" 
                                    style={{ height: `${(newCasesTotal / maxTotal) * 100}%` }} // Scale by maxTotal
                                    title={`New Cases: ${newCasesTotal}`}
                                ></div>
                            </div>
                            <div className="graph-titles">
                                <h4>{month}</h4>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export default HBarChart;