import React, { useRef, useEffect, useState } from 'react';

const HBarChart = ({ data, formatNumber }) => {
    const parsedData = JSON.parse(data);
    const parentRef = useRef(null);
    const [parentHeight, setParentHeight] = useState(0);
    const [monthsToShow, setMonthsToShow] = useState(3);
    const [labelsCount, setLabelsCount] = useState(3);

    useEffect(() => {
        const updateChartSettings = () => {
            if (parentRef.current) {
                requestAnimationFrame(() => {
                    setParentHeight(parentRef.current.clientHeight - 31);
                });
            }
    
            setMonthsToShow(window.innerWidth > 1024 ? sortedEntries.length : 3);
            setLabelsCount(window.innerWidth > 1024 ? 5 : 3);
        };
    
        updateChartSettings();
    
        window.addEventListener("resize", updateChartSettings);
    
        return () => window.removeEventListener("resize", updateChartSettings);
    }, []);

    const monthOrder = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const sortedEntries = Object.entries(parsedData)
        .sort(([a], [b]) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

    const displayedEntries = sortedEntries.slice(-monthsToShow);

    const maxTotal = Math.max(...displayedEntries.flatMap(([_, values]) => values));

    const yAxisLabels = labelsCount === 5 
        ? Array.from({ length: 5 }, (_, i) => `${formatNumber((maxTotal / 4) * i, "a")}`).reverse()
        : [
            `${formatNumber(maxTotal, "a")} - `,
            `${formatNumber(maxTotal / 2, "a")} - `,
            `0 - `
        ];

    return (
        <div className='horizontal-graph-container' ref={parentRef}>
            {/* Y-Axis */}
            <div className="y-axis">
                {yAxisLabels.map((label, index) => (
                    <div key={index} className="y-axis-label">{label}</div>
                ))}
            </div>

            {/* Graph Content */}
            <div className="horizontal-graph chart">
                {/* Grid Lines */}
                <div className='grid-lines'>
                    {yAxisLabels.map((_, index) => (
                        <div key={`${index}-grid-line`} className="y-grid-line"></div>
                    ))}
                </div>

                {/* Bars */}
                {displayedEntries.map(([month, values]) => {
                    const [intakeTotal = 0, newCasesTotal = null] = values;
                    const intakeHeightPx = (intakeTotal / maxTotal) * parentHeight;
                    const newCasesHeightPx = newCasesTotal !== null ? (newCasesTotal / maxTotal) * parentHeight : 0;

                    return (
                        <div className="period" key={month}>
                            <div className='graph-bars'>
                                <div 
                                    className="ttb-bar intake"
                                    style={{ height: `${intakeHeightPx}px` }}
                                    title={`Intake: ${intakeTotal}`}
                                ></div>
                                {newCasesTotal !== null && (
                                    <div 
                                        className="ttb-bar new-cases"
                                        style={{ height: `${newCasesHeightPx}px` }}
                                        title={`New Cases: ${newCasesTotal}`}
                                    ></div>
                                )}
                            </div>
                            <div className="graph-titles">
                                <h4>{month}</h4>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default HBarChart;