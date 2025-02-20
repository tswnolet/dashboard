import React, { useEffect, useState } from 'react';
import HBarChart from './HBarChart';
import VBarChart from './VBarChart';
import PieChartComponent from './PieChart';
import LineGraph from './LineGraph';
import '../Card.css';
import { UpTrend } from './UpTrend';
import { DownTrend } from './DownTrend';
import { NoTrend } from './NoTrend';

const Card = ({ data, type = "", secondData = null, headers, yAxisLabel, format, styling, slice, prevData, total }) => {
    const [hoveringGoogle, setHoveringGoogle] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'total_referred', direction: 'descending' });
    const [smallScreen, setSmallScreen] = useState(window.innerWidth < 1025);

    useEffect(() => {
        const handleResize = () => {
            setSmallScreen(window.innerWidth < 1025);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const defaultGridSize = {
        "h-bar": { 
            col: typeof data.data === "object" && data.data !== null 
                ? Object.keys(data.data).length > 5 
                    ? 3
                    : Object.keys(data.data).length <= 2
                        ? 1
                        : 2
                : 2,
            row: 2
        },
        "v-bar": { col: 2, row: 2 }, 
        "pie": { col: 2, row: 2 },
        "line": { col: 2, row: 2},
        "def": { col: 1, row: 2 },
        "percentage": { col: 1, row: 1 },
        "value": { col: 1, row: 1 },
        "rank": { col: 1, row: 2 },
        "list": { col: 2, row: 4 },
        "table": { col: 4, row: 4 }
    };

    const { col, row } = { col: data.col ?? 2, row: data.row ?? 1 };
    
    const cardStyle = {
        gridColumn: `span ${data.col || defaultGridSize[type]?.col || col}`,
        gridRow: row === "auto" ? "auto" : `span ${parseInt(data.row) || row}`,
        ...(type === 'list' ? { alignItems: 'start' } : {})
    };

    const formatNumber = (num, approx = null, dType = '') => {
        if (!num && num !== 0) return "N/A";

        const number = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;

        if (approx === "e") {
            return `${dType === "$" ? '$' : ''}${number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        if (approx === "a") {
            return `${dType === "$" ? '$' : ''}${number.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        }

        if (approx === "ae") {
            return `${dType === '$' ? '$' : ''}${(number / (number > 1_000_000 ? 1_000_000 : number >= 1_000 ? 1_000 : 1)).toFixed(0).replace(/\.0$/, '')}${number >= 1_000_000 ? 'M' : number >= 1_000 ?  'K' : ''}`;
        }

        if (number >= 1_000_000) {
            return `${dType === "$" ? '$' : ''}${(number / 1_000_000).toFixed(2).replace(/\.0$/, '')}M`;
        } else if (number >= 1_000) {
            return `${dType === "$" ? '$' : ''}${(number / 1_000).toFixed(2).replace(/\.0$/, '')}K`;
        }

        return `${dType === "$" ? '$' : ''}${number.toString()}`;
    };

    const sortedData = React.useMemo(() => {
        let sortableData = Object.entries(data.data);
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                if (sortConfig.key === 'disengagement_percent') {
                    const aPercent = (a[1].total_disengaged / a[1].total_referred) * 100;
                    const bPercent = (b[1].total_disengaged / b[1].total_referred) * 100;
                    if (aPercent < bPercent) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (aPercent > bPercent) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                    return 0;
                } else {
                    if (a[1][sortConfig.key] < b[1][sortConfig.key]) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (a[1][sortConfig.key] > b[1][sortConfig.key]) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                    return 0;
                }
            });
        }
        return sortableData;
    }, [data.data, sortConfig]);

    const exclusions = ["Total Referred", "Settlement Total", "Average Referral Fee"];
    
    const requestSort = key => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className={`card ${type==='list' ? 'list' : ''}`} style={{ gridRow: `span ${row}`, gridColumn: `span ${col}`, justifyContent: data.data["Impressions"] || type != 'list' ? 'space-between' : 'center' }}>
            <div className='card-header'>
                <p>{data.title}</p>
                {prevData && typeof data.data[1] === 'number' ? (
                    <span className='percentage-change'>
                        {(((data.data[1] - prevData[1]) / prevData[1]) * 100) > 0 ? (
                            <UpTrend />
                        ) : (((data.data[1] - prevData[1]) / prevData[1]) * 100) < 0 ? (
                            <DownTrend />
                        ) : (((data.data[1] - prevData[1]) / prevData[1]) * 100) == 0 && (
                            <NoTrend />
                        )}
                        {Math.abs(formatNumber(((data.data[1] - prevData[1]) / prevData[1]) * 100, "e"))}%
                    </span>
                    ) : (
                        total && (
                            <span className='percentage-change'>
                                {((total[0] - total[1]) / total[1] * 100) > 0 ? (
                                    <>
                                        <UpTrend />
                                    </>
                                    
                                ) : ((total[0] - total[1]) / total[1] * 100) < 0 ? (
                                    <DownTrend />
                                ) : ((total[0] - total[1]) / total[1] * 100) == 0 && (
                                    <NoTrend />
                                )}
                                {Math.abs(formatNumber((parseFloat(total[0]) - parseFloat(total[1])) / parseFloat(total[1]) * 100, "e"))}%
                            </span>
                        )
                    )
                }
            </div>
            {type == "" || type == "def" ? (
                data.title === "Total Settlement"
                    ? (
                        <>
                            <div className="value">
                                <h1>{formatNumber(data.data[1], "", "$")}</h1>
                                <h4>/ {formatNumber(data.data[0], "", "$")}</h4>
                            </div>
                        </>
                    ) : <h1 className='value'>{data.data}</h1>
            ) : type == 'percentage' ? (
                <div className="value">
                    <h1>{formatNumber(data.data[1], "e")}%</h1>
                    <h4>/ {data.data[0]} suits</h4>
                </div>
            ) : type === 'value' ? (
                <div className="value">
                    <h1>{formatNumber(data.data[0] || data.data, "a")}</h1>
                    {data.data[1] && <h4>On pace for {formatNumber(data.data[1], "a")}</h4>}
                </div>
            ) : type === 'line' ? (
                <LineGraph data={data.data} title={data.title} formatNumber={formatNumber} secondData={secondData} yAxisLabel={yAxisLabel} />
            ) : type === 'h-bar' ? (
                <HBarChart data={data.data} title={data.title} formatNumber={formatNumber} />
            ) : type === 'v-bar' ? (
                <VBarChart data={data.data} title={data.title} formatNumber={formatNumber} format={format} slice={slice}/>
            ) : type === 'pie' || type === 'piecol' ? (
                <PieChartComponent data={data.data} title={data.title} formatNumber={formatNumber} format={type === 'piecol' ? "column" : "row"}/>
            ) : type === 'list' ? (
                <>
                    {data.data["Impressions"] && <div className="card-list">
                        {Object.entries(data.data).map(([key, value], index) => 
                            key !== 'keywords' && (
                                <div className="card-list-item"
                                    key={index}
                                    onMouseOver={() => setHoveringGoogle(index)}
                                    onMouseOut={() => setHoveringGoogle(null)}
                                    style={hoveringGoogle === index ? { backgroundColor: styling[index] } : {}}
                                >
                                    <span className={`card-list-item-title ${hoveringGoogle === index ? 'hovering' : ''}`}>{key}</span>
                                    <span className={`card-list-item-value ${hoveringGoogle === index ? 'hovering' : ''}`} title={value}>
                                        {Array.isArray(value) ? formatNumber(value[0], null, "$") : !value.includes("%") ? formatNumber(value, "ae") : value}
                                    </span>
                                    {Array.isArray(value) && typeof value[1] === 'number' && (
                                        <span className={`card-list-item-subvalue ${hoveringGoogle === index ? 'hovering' : ''}`}>${value[1]}</span>
                                    )}
                                </div>
                            )
                        )}
                    </div>}
                    {data.data.keywords && data.data.keywords.length > 0 && (
                        <table className={`keywords-table ${data.title === "Top 10 Keywords (All Campaigns) - Google Ads" ? 'top-10' : ''}`}>
                            <thead>
                                <tr>
                                    <th style={{minWidth: !smallScreen ? "30%" : "60%"}}>Keyword{!smallScreen && <span className='table-subvalue'>{" "}(Ad Group)</span>}</th>
                                    {!smallScreen && (
                                        <>
                                            <th>Impressions</th>
                                            <th>Clicks</th>
                                        </>
                                    )}
                                    <th>Conversions</th>
                                    {!smallScreen && (
                                        <>
                                            <th>Cost (CPC)</th>
                                            <th>CTR</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.keywords.map((keyword, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'clear' : 'light'}>
                                        <td style={{minWidth: !smallScreen ? "30%" : "60%"}}>{keyword.keyword_text.replace(/\+/g, '')}{!smallScreen && <span className='table-subvalue'>{keyword.ad_group_name !== "Ad group 1" ? ` (${keyword.ad_group_name})` : ""}</span>}</td>
                                        {!smallScreen && (
                                            <>
                                                <td>{keyword.impressions}</td>
                                                <td>{keyword.clicks}</td>
                                            </>
                                        )}
                                        <td>{keyword.conversions}</td>
                                        {!smallScreen && (
                                            <>
                                                <td>${keyword.cost_usd }<span className='table-subvalue'>(${keyword.cost_per_conversion})</span></td>
                                                <td>{(keyword.ctr * 100).toFixed(2)}%</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            ) : type === 'table' ? (
                <table className='card-table'>
                    <thead>
                        <tr>
                            {Array.isArray(data.headers) &&
                                data.headers.map((header, index) =>
                                    exclusions.includes(header) ? null : (
                                        <th key={index} onClick={() => requestSort(header)}>{header}</th>
                                    )
                                )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map(([key, value], index) => (
                            <tr key={index} className={index % 2 === 0 ? 'clear' : 'light'}>
                                <td style={{ width: `${100 / Object.keys(value).length}%` }} title={key}>{key}</td>
                                {Object.entries(value)
                                    .filter(([_, v], index) => !exclusions.includes(data.headers[index]))
                                    .map(([_, v], index) => (
                                        <td
                                            style={{ width: `${100 / Object.keys(value).length}%` }}
                                            key={index}
                                            onClick={() => requestSort(v)}
                                            title={v}
                                        >
                                            {v}
                                        </td>
                                    ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : null}
        </div>
    );
}

export default Card;