import React from 'react';

const Reports = () => {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await fetch('/api/reports.php');
            const data = await response.json();
            setReports(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    return (
        <div>
            <h1>Reports</h1>
            <ul>
                {reports.map(report => (
                    <li key={report.id}>
                        <h2>{report.title}</h2>
                        <p>{report.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Reports;