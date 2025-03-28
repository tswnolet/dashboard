import React, { useState, useEffect } from "react";
import '../styles/ActivityFeed.css';
import {
    StickyNote,
    Mail as Email,
    LucideScrollText as All,
    Printer,
    Phone,
    MessageSquare,
    CheckSquare,
    AlarmClock,
    ArrowUp,
    ChevronUp,
  } from "lucide-react";
import { SearchBar } from "./Nav";
import { AddActivity } from "./FieldComponents";
  
  export const iconMap = {
    All: <All size={18} />,
    Notes: <StickyNote size={18} />,
    Emails: <Email size={18} />,
    Faxes: <Printer size={18} />,
    'Phone Calls': <Phone size={18} />,
    Texts: <MessageSquare size={18} />,
    Tasks: <CheckSquare size={18} />,
    Reminders: <AlarmClock size={18} />,
  };
  

const FeedItem = ({ type, setActiveFeed, activeFeed }) => {

    return (
        <div className={`feed-type${activeFeed === type ? ' active' : ''}`} onClick={() => setActiveFeed(type)}>
            <span className='feed-type-text'>
                {iconMap[type]}{type}
            </span>
        </div>
    );
};

const Activity = ({ data }) => {
    return (
        <div className="activity-feed-item">
            <div className="activity-feed-item-header subtext">
                <span className="activity-feed-item-author">{data.author}</span>
                <span className="activity-feed-item-date">{new Date(data.creation_date).toLocaleDateString()}</span>
            </div>
            {Array.isArray(data.tags) && data.tags.length > 0 && 
                <div className='activity-feed-tags'>
                    {data.tags.map((tag, index) => (
                        <span key={index} className="activity-feed-tag tag">#{tag}</span>
                    ))}
                </div>
            }
            <div className='activity-title'>
                {data.subject}
            </div>
            <div className="activity-feed-item-content">
                {data.content}
            </div>
        </div>
    )
}

export const ActivityFeed = ({ case_id }) => {
    const [feed, setFeed] = useState([]);
    const [activeFeed, setActiveFeed] = useState("All");
    const [expanded, setExpanded] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [addActivity, setAddActivity] = useState(false);

    const fetchFeed = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/activity_feed.php?case_id=${case_id}&${new Date().getTime()}`);
            const data = await response.json();
            setFeed(data.feed_updates);
        } catch (error) {
            console.error("Error fetching activity feed:", error);
        }
    }

    useEffect(() => {
        fetchFeed();
    }, []);

    return (
        <div className='activity-feed'>
            <div className='feed-types'>
                <FeedItem type="All" setActiveFeed={setActiveFeed} activeFeed={activeFeed} />
                <FeedItem type="Notes" setActiveFeed={setActiveFeed} activeFeed={activeFeed} />
                <FeedItem type="Emails" setActiveFeed={setActiveFeed} activeFeed={activeFeed} />
                <FeedItem type="Faxes" setActiveFeed={setActiveFeed} activeFeed={activeFeed} />
                <FeedItem type="Phone Calls" setActiveFeed={setActiveFeed} activeFeed={activeFeed} />
                <FeedItem type="Texts" setActiveFeed={setActiveFeed} activeFeed={activeFeed} />
                <FeedItem type="Tasks" setActiveFeed={setActiveFeed} activeFeed={activeFeed} />
                <FeedItem type="Reminders" setActiveFeed={setActiveFeed} activeFeed={activeFeed} />
            </div>
            <div className='feed'>
                <div className='feed-filters'>
                    <button className={`action filter-button${activeFeed === 'All' ? ' active' : ''}`} onClick={() => setActiveFeed('All')}>
                        Filter <ChevronUp size={16} />
                    </button>
                    <SearchBar placeholder="Search" expanded={expanded} setExpanded={setExpanded} setSearchQuery={setSearchQuery} />
                </div>
                <AddActivity onClick={() => setAddActivity(true)} setAddActivity={setAddActivity} addActivity={addActivity} />
                {feed.filter((type) => (type.type == String(activeFeed).toLocaleLowerCase() || activeFeed === 'All') && type != 'No activity found').map((item, index) => (
                    <Activity key={index} data={item} />
                ))}
            </div>
        </div>
    );
}