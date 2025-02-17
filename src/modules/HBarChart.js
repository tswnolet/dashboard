import React, { useRef, useEffect, useState } from 'react';
import Loading from './Loading';

const HBarChart = ({ data, formatNumber }) => {
    const parsedData = data && typeof data === "string" ? JSON.parse(data) : data || {};

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

            setMonthsToShow(window.innerWidth > 1024 ? Object.keys(parsedData || {}).length : 3);
            setLabelsCount(window.innerWidth > 1024 ? 5 : 3);
        };

        updateChartSettings();
        window.addEventListener("resize", updateChartSettings);

        return () => window.removeEventListener("resize", updateChartSettings);
    }, [parsedData]);

    if (!parsedData || Object.keys(parsedData).length === 0) {
        return <Loading />;
    }

    const monthOrder = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const sortedEntries = Object.entries(parsedData)
        .sort(([a], [b]) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

    const displayedEntries = sortedEntries.slice(-monthsToShow);

    if (displayedEntries.length === 0) {
        return <Loading />;
    }

    const maxTotal = Math.max(
            ...displayedEntries.flatMap(([_, values]) => Array.isArray(values) ? typeof values[0] === 'number' ? values : values[1] : [values]
        )
    ) || 1;

    const yAxisLabels = labelsCount === 5
        ? Array.from({ length: 5 }, (_, i) => `${formatNumber((maxTotal / 4) * i)}`).reverse()
        : [
            `${formatNumber(maxTotal)}`,
            `${formatNumber(maxTotal / 2)}`,
            `0`
        ];

    return (
        <div className='horizontal-graph-container' ref={parentRef}>
            <div className="y-axis">
                {yAxisLabels.map((label, index) => (
                    <div key={index} className="y-axis-label">{typeof label === 'number' ? label >= 1_000_000 ? label / 1_000 : label : label}</div>
                ))}
            </div>
            <div className="horizontal-graph chart">
                <div className='grid-lines'>
                    {yAxisLabels.map((_, index) => (
                        <div key={`${index}-grid-line`} className="y-grid-line"></div>
                    ))}
                </div>
                {displayedEntries.map(([name, values], index) => {
                    if((Array.isArray(values) && values[1] && typeof values[0] != 'string') || !Array.isArray(values)) {
                        let firstTotal = 0;
                        let secondTotal = 0;

                        if (Array.isArray(values)) {
                            [firstTotal = 0, secondTotal = 0] = values;
                        } else {
                            firstTotal = values;
                        }

                        const firstHeightPx = (firstTotal / maxTotal) * parentHeight;
                        const secondHeightPx = (secondTotal / maxTotal) * parentHeight;

                        return (
                            <div className="period" key={name}>
                                <div className='graph-bars'>
                                    <div 
                                        className="ttb-bar first"
                                        style={{ height: `${firstHeightPx}px` }}
                                        title={`${name}: ${firstTotal}`}
                                    ></div>
                                    {secondTotal > 0 && (
                                        <div 
                                            className="ttb-bar second"
                                            style={{ height: `${secondHeightPx}px` }}
                                            title={`${name}: ${secondTotal}`}
                                        ></div>
                                    )}
                                </div>
                                <div className="graph-titles">
                                    <h4>{name}</h4>
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div className="period" key={values[0]+ " " + index}>
                                <div className='graph-bars'>
                                    <div 
                                        className="ttb-bar first"
                                        style={{ height: `${(values[1] / maxTotal) * parentHeight}px` }}
                                        title={`${name}: ${values[1]}`}
                                    ></div>
                                </div>
                                <div className="graph-titles">
                                    <h4>{values[0]}</h4>
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
};

export default HBarChart;