import React from 'react';
import '../Card.css';

// Card component to display data
const Card = ({ data, type }) => {
    const cardStyle = {
        gridColumn: `span ${parseInt(data.col) || 1}`,
        gridRow: `span ${parseInt(data.row) || 1}`
    };

    const maxTotal = type ? Math.max(...Object.values(data.data).flat()) : 1;

    return (
        <div className='card'style={cardStyle}>
            {!type ? (
                <>
                    <p>{data.title}</p>
                    <h3>{data.data}</h3>
                </>
            ) : (
                <>
                    <p>{data.title}</p>
                    <div className="vertical-graph">
                    {Object.entries(data.data).map(([month, values]) => {
                        const [intakeTotal, newCasesTotal] = values;
                        return (
                            <div className='month'>
                                <div 
                                    className="graph-bar intake" 
                                    style={{ height: `${(intakeTotal / maxTotal) * 100}%` }}
                                ></div>
                                <div 
                                    className="graph-bar new-cases" 
                                    style={{ height: `${(newCasesTotal / maxTotal) * 100}%` }}
                                ></div>
                            </div>
                        );
                    })}
                    </div>
                    <div className="graph-titles">
                        {Object.entries(data.data).map(([key, value]) => (
                            <h3 key={key}>{key}</h3>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Card;