import React from "react";

export const PrivacyPolicy = () => {
    return (
        <div className="page-container">
            <h1>Privacy Policy</h1>
            <p>Last Updated: 2/7/2025 9:19 AM</p>

            <h2>1. Introduction</h2>
            <p>
                This Privacy Policy describes how [Your Company Name] ("we", "our", or "us") handles data accessed through
                our internal application. This application is strictly for **internal company use** and is **not available to the public**.
            </p>

            <h2>2. Data We Access</h2>
            <p>
                Our application retrieves advertising campaign data from Google Ads API to provide **performance insights** for company shareholders and employees. The data accessed includes:
            </p>
            <ul>
                <li>Campaign names and IDs</li>
                <li>Impressions, clicks, conversions, and costs</li>
                <li>Performance analytics for reporting purposes</li>
            </ul>

            <h2>3. How We Use the Data</h2>
            <p>
                All data retrieved from Google Ads API is used **exclusively for internal business reporting** and **decision-making** within [Your Company Name].
                We **do not** share, sell, or distribute this data to external parties.
            </p>

            <h2>4. Access & Security</h2>
            <p>
                Access to this application is **strictly limited** to authorized employees of [Your Company Name].
                All user interactions with Google Ads data are secured and comply with Google's API policies.
            </p>

            <h2>5. Data Storage</h2>
            <p>
                Our application **does not permanently store** Google Ads data. Data is retrieved in real-time for reporting purposes.
                If any temporary data storage is required, it is secured and **accessible only to authorized personnel**.
            </p>

            <h2>6. User Rights & Data Control</h2>
            <p>
                Since this is an internal application, only **authorized users** within [Your Company Name] have access. Users can revoke Google Ads API access at any time through their **Google account settings**.
            </p>

            <h2>7. Third-Party Services</h2>
            <p>
                This application integrates with Google Ads API, which is governed by Google's{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                </a>.
                No additional third-party services are used to process or share data.
            </p>

            <h2>8. Changes to This Privacy Policy</h2>
            <p>
                We may update this Privacy Policy as needed to comply with company policies or Google API requirements. Any updates will be communicated internally.
            </p>
        </div>
    );
};