import React, { useState, useEffect, useRef } from "react";
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
    EllipsisVertical,
    Ellipsis,
    Pin,
    PinOff,
  } from "lucide-react";
import { SearchBar } from "./Nav";
import { AddActivity, File, Notification } from "./FieldComponents";
import { PinOutlined } from "@mui/icons-material";
import { file } from "jszip";
  
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
  

const FeedItem = ({ type, setActiveFeed, activeFeed, notifications }) => {
    return (
        <div className={`feed-type${activeFeed === type ? ' active' : ''}`} onClick={() => setActiveFeed(type)}>
            <span className='feed-type-text'>
                {iconMap[type]}{type}
                {type === 'Reminders' && (notifications.reminder > 0 || notifications.priority > 0) &&
                    <div className='tasks-notis'>
                        {notifications.priority > 0 && <Notification count={notifications.priority} type='priority' />}
                        {notifications.reminder > 0 && <Notification count={notifications.reminder} type='reminder' />}
                    </div>
                }
            </span>
        </div>
    );
};

const Activity = ({ data, user_id, user, fetchFeed }) => {
    const [showOptions, setShowOptions] = useState(false);
    const optionRef = useRef(null);
    const [hoveringPin, setHoveringPin] = useState(null);
    const deadline = data?.deadline?.due
        ? new Date(data.deadline.due).toLocaleDateString()
        : "Not set";

    const pinNote = (pin, action) => {
        try {
            fetch(`https://dalyblackdata.com/api/activity_feed.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: data.id,
                    pin: pin,
                    action: action
                }),
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    setShowOptions(false);
                    fetchFeed();
                } else {
                    console.error("Error pinning note:", data.message);
                }
            })
            .catch((error) => {
                console.error("Error pinning note:", error);
            });
        } catch (error) {
            console.error("Error pinning note:", error);
        }
    }

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (optionRef.current && !optionRef.current.contains(e.target)) {
                setShowOptions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    console.log(data.attachments);

    return (
        <div className="activity-feed-item">
            <div className="activity-feed-item-header subtext">
                <span className="activity-feed-item-author">{data.author}</span>
                <span className="activity-feed-item-date">{new Date(data.creation_date).toLocaleDateString()}</span>
                {data.task && <span className="activity-feed-item-task">Assigned to: {user} Due: {deadline}</span>}
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
            {Array.isArray(data.attachments) && <div className='files'>
                {data.attachments.map((file, index) => (
                    <File file={file} key={index} />
                ))}
            </div>}
            <div className='activity-feed-item-menu' ref={optionRef}>
                <div className='activity-menu-actions'>
                    {data.pinned && (() => {
                        const pinData = typeof data.pinned === 'string' ? JSON.parse(data.pinned) : data.pinned;
                        const isPinnedForUser = Array.isArray(pinData?.users) && pinData.users.includes(Number(user_id));
                        const isPinnedForCase = pinData?.case === 1;

                        if (!isPinnedForUser && !isPinnedForCase) return null;

                        return (
                            <div className="activity-feed-item-pin">
                                {isPinnedForUser && (
                                    <div
                                        className='activity-pin'
                                        title='Pinned to My Feed'
                                        onMouseOver={() => setHoveringPin("personal")}
                                        onMouseLeave={() => setHoveringPin(null)}
                                    >
                                        {hoveringPin !== 'personal'
                                            ? <Pin size={17} />
                                            : <PinOff size={17} onClick={() => pinNote(user_id, "remove")} />}
                                    </div>
                                )}
                                {isPinnedForCase && (
                                    <div
                                        className='activity-pin case-pin'
                                        title='Pinned to Project Feed'
                                        onMouseOver={() => setHoveringPin("project")}
                                        onMouseLeave={() => setHoveringPin(null)}
                                    >
                                        {hoveringPin !== 'project'
                                            ? <Pin size={17} />
                                            : <PinOff size={17} onClick={() => pinNote("project", "remove")} />}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    <Ellipsis className="activity-feed-item-options" size={20} onClick={() => setShowOptions((prev) => !prev) }/>
                </div>
                {showOptions && (
                    <div className="activity-feed-item-options-menu">
                        <div className="activity-feed-item-option">Edit</div>
                        <div className="activity-feed-item-option" onClick={() => pinNote(user_id)}>Pin to My Feed</div>
                        <div className="activity-feed-item-option" onClick={() => pinNote("project")}>Pin to Case Feed</div>
                        <div className="activity-feed-item-option">Copy Link</div>
                        <div className="activity-feed-item-option">Move to...</div>
                    </div>
                )}
            </div>
        </div>
    )
}

export const ActivityFeed = ({ case_id, user_id }) => {
    const [feed, setFeed] = useState([]);
    const [activeFeed, setActiveFeed] = useState("All");
    const [expanded, setExpanded] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [addActivity, setAddActivity] = useState(false);
    const [users, setUsers] = useState([]);

    const today = new Date().toDateString();

    const fetchFeed = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/activity_feed.php?case_id=${case_id}&${new Date().getTime()}`);
            const data = await response.json();
            setFeed(data.feed_updates);
        } catch (error) {
            console.error("Error fetching activity feed:", error);
        }
    }
    
    const fetchUsers = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/user.php?time=${new Date().getTime()}`);
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    useEffect(() => {
        fetchFeed();
        fetchUsers();
    }, []);

    const filteredFeed = feed.filter(
        (type) =>
            (type.type === String(activeFeed).toLowerCase() ||
                activeFeed === "All" ||
                (type.type === "tasks" && activeFeed === "Reminders")) &&
            type !== "No activity found" &&
            type.deleted !== 1
    );

    const pinnedFeed = filteredFeed.filter((item) => {
        if (!item.pinned) return false;
        const pinData = typeof item.pinned === 'string' ? JSON.parse(item.pinned) : item.pinned;
        const isPinnedForUser = Array.isArray(pinData?.users) && pinData.users.includes(Number(user_id));
        const isPinnedForCase = pinData?.case === 1;
        return isPinnedForUser || isPinnedForCase;
    });    

    const pinnedIds = new Set(pinnedFeed.map(item => item.id));

    const todayFeed = filteredFeed.filter(
        (item) =>
            !pinnedIds.has(item.id) &&
            new Date(item.creation_date).toDateString() === today
    );
    
    const earlierFeed = filteredFeed.filter(
        (item) =>
            !pinnedIds.has(item.id) &&
            new Date(item.creation_date).toDateString() !== today
    );

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
                <FeedItem
                    type="Reminders"
                    setActiveFeed={setActiveFeed}
                    activeFeed={activeFeed}
                    notifications={{
                        reminder: feed.filter((data) => (
                            data.deadline?.due &&
                            Array.isArray(data.deadline.assignees) &&
                            data.deadline.assignees.includes(Number(user_id))
                        )
                            ? new Date(data.deadline.due) >= new Date().setDate(new Date().getDate() + 7) 
                            : null).length,
                        priority: feed.filter((data) => (
                            data.deadline?.due &&
                            Array.isArray(data.deadline.assignees) &&
                            data.deadline.assignees.includes(Number(user_id))
                        ) 
                            ? new Date(data.deadline.due) <=  new Date().setDate(new Date().getDate() + 7)
                            : null).length,
                    }}
                />
            </div>
            <div className='feed'>
                <div className='feed-filters'>
                    <button className={`action filter-button${activeFeed === 'All' ? ' active' : ''}`} onClick={() => setActiveFeed('All')}>
                        Filter <ChevronUp size={16} />
                    </button>
                    <SearchBar placeholder="Search" expanded={expanded} setExpanded={setExpanded} setSearchQuery={setSearchQuery} />
                </div>
                <AddActivity fetchFeed={fetchFeed} case_id={case_id} onClick={() => setAddActivity(true)} setAddActivity={setAddActivity} addActivity={addActivity} users={users} />
                {pinnedFeed.length > 0 && (
                    <>
                        <div className="activity-feed-header subtext">
                            <span>Pinned</span>
                            <div className='divider horizontal'></div>
                            <span>{pinnedFeed.length} {pinnedFeed.length > 1 ? "items" : "item"}</span>
                        </div>
                        {pinnedFeed.map((item, index) => (
                            <Activity
                                key={`pinned-${index}`}
                                data={item}
                                user_id={user_id}
                                user={users.find((user) => String(user.id) === String(item.task))?.name || "Unknown"}
                                fetchFeed={fetchFeed}
                            />
                        ))}
                    </>
                )}
                {todayFeed.length > 0 && (
                    <>
                        <div className="activity-feed-header subtext">
                            <span>Today</span>
                            <div className='divider horizontal'></div>
                            <span>{todayFeed.length} {todayFeed.length > 1 ? "items" : "item"}</span>
                        </div>
                        {todayFeed.map((item, index) => (
                            <Activity
                                key={`today-${index}`}
                                data={item}
                                user_id={user_id}
                                user={users.find((user) => String(user.id) === String(item.task))?.name || "Unknown"}
                                fetchFeed={fetchFeed}
                            />
                        ))}
                    </>
                )}
                {earlierFeed.length > 0 && (
                    <>
                        <div className="activity-feed-header subtext">
                            <span>Earlier</span>
                            <div className='divider horizontal'></div>
                            <span>{earlierFeed.length} {earlierFeed.length > 1 ? "items" : "item"}</span>
                        </div>
                        {earlierFeed.map((item, index) => (
                            <Activity
                                key={`earlier-${index}`}
                                data={item}
                                user_id={user_id}
                                user={users.find((user) => String(user.id) === String(item.task))?.name || "Unknown"}
                                fetchFeed={fetchFeed}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}