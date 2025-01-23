import requests
import json

# Filevine Credentials
API_KEY = "fvpk_19ef8e96-2f40-371a-dce2-98666f5a9e80"
BASE_URL = "https://dalyblack.api.filevineapp.com"

# Query parameters
START_DATE = "2025-01-01T00:00:00Z"
PAGE_SIZE = 50

def authenticate():
    """Authenticate using API key and retrieve session details."""
    url = f"{BASE_URL}/api/auth/login"
    headers = {"Authorization": f"Bearer {API_KEY}"}

    response = requests.post(url, headers=headers)

    if response.status_code != 200:
        print(f"Authentication Error {response.status_code}: {response.text}")
        return None
    
    session_data = response.json()
    return session_data

def get_projects_created_after(start_date, session_data):
    """Retrieve projects created after the specified date using session authentication."""
    url = f"{BASE_URL}/api/projects"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "x-fv-userid": session_data["userId"],
        "x-fv-orgid": session_data["orgId"],
        "x-fv-sessionid": session_data["sessionId"]
    }

    params = {
        "sort": "createdDate",
        "order": "asc",
        "filter": json.dumps({"createdDate": { "$gte": start_date }}),
        "limit": PAGE_SIZE
    }

    all_projects = []
    next_page_token = None

    while True:
        if next_page_token:
            params["pageToken"] = next_page_token
        
        response = requests.get(url, headers=headers, params=params)

        if response.status_code != 200:
            print(f"Error {response.status_code}: {response.text}")
            break

        data = response.json()
        projects = data.get("items", [])
        all_projects.extend(projects)

        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break  # No more pages

    return all_projects

# Step 1: Authenticate to get session details
session_data = authenticate()
if not session_data:
    print("Failed to authenticate. Exiting.")
    exit()

# Step 2: Fetch projects using session headers
projects = get_projects_created_after(START_DATE, session_data)

# Print results
if projects:
    print(f"Retrieved {len(projects)} projects created after {START_DATE}")
    for project in projects:
        print(f"ID: {project['projectId']}, Name: {project['projectName']}, Created: {project['createdDate']}")
else:
    print("No projects found.")