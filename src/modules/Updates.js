import React, { useState, useEffect } from 'react';
import '../styles/Updates.css';
import { Close } from '@mui/icons-material';

const UpdateCard = ({ title, version, features }) => {
    return (
        <div className="update-card">
            <p>{title} <span className='version'>- {version}</span></p>
            <ul className='features'>
                {Array.isArray(Object.features) && features.map((feature, index) => (
                    <li key={index} className='feature'>{feature}</li>
                ))}
            </ul>
        </div>
    );
};

export const Updates = () => {
    const [updates, setUpdates] = useState({ titles: [], versions: [], features: [] });
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const response = await fetch('https://dalyblackdata.com/api/updates.php');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                
                if (
                    data &&
                    Array.isArray(data.titles) &&
                    Array.isArray(data.versions) &&
                    Array.isArray(data.features)
                ) {
                    setUpdates(data);
                } else {
                    throw new Error("Unexpected API response structure");
                }

            } catch (error) {
                console.error('Error fetching updates:', error);

                if (process.env.NODE_ENV === 'development') {
                    setUpdates({
                        titles: ["Initial Release", "Bug Fixes & Improvements"],
                        versions: ["1.0.0", "1.1.0"],
                        features: [
                            ["Core functionality added", "Initial API integration"],
                            ["Fixed UI glitches", "Improved performance"]
                        ]
                    });
                }
            }
        };

        fetchUpdates();
    }, []);

    if (!updates.titles || updates.titles.length === 0) {
        return null;
    }

    const setSeenUpdates = () => {
        const maxVersion = Math.max(...updates.versions.map(v => parseFloat(v)));

        fetch('https://dalyblackdata.com/api/updates.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ seen: maxVersion })
        }).then(response => response.json())
          .then(data => {
                if (data.success) {
                    setUpdates({ titles: [], versions: [], features: [] });
                } else {
                    console.error('Error marking updates as seen:', data.error);
                }
          })
          .catch(error => console.error('Error marking updates as seen:', error));
          setIsVisible(false);
    };

    return (
        isVisible && (
            <div id="updates" style={{ display: isVisible ? 'flex' : 'none' }}>
                <h3 id='update-title'>Updates</h3>
                <Close className="close" onClick={setSeenUpdates} style={{ cursor: "pointer", position: "absolute", top: "15px", right: "15px"}}/>
                {updates.titles.map((title, index) => (
                    <UpdateCard 
                        key={index} 
                        title={title} 
                        version={updates.versions[index] || "N/A"} 
                        features={updates.features[index] || []} 
                    />
                ))}
            </div>
        )
    );
};