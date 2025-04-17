import requests
import mysql.connector
import json
import time

# --- CONFIGURATION ---
PAT = "9512B54B66C5C6FEA35129F07FBF223202ACEA65384E20A6C33FF811152DE19F"
CLIENT_ID = "85105ea4-32f5-4a4f-ae88-51d0c61b4ba5"
CLIENT_SECRET = "IW39#GQLigTyA+d3Bm48M}pLy"

DB_CONFIG = {
    "host": "db-casedb.cq58cae80fw0.us-east-1.rds.amazonaws.com",
    "user": "admin",
    "password": "Scorpius1!",
    "database": "casedb"
}
# ----------------------

def get_bearer_token():
    url = "https://identity.filevine.com/connect/token"
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "personal_access_token",
        "scope": "fv.api.gateway.access tenant filevine.v2.api.* email openid fv.auth.tenant.read fv.vitals.api.* fv.payments.api.all filevine.v2.webhooks",
        "token": PAT
    }
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    response = requests.post(url, headers=headers, data=payload)

    try:
        response.raise_for_status()
        return response.json()["access_token"]
    except requests.HTTPError as e:
        print("❌ Error fetching token:")
        print(response.status_code, response.text)
        raise e

def get_user_org_ids(bearer_token):
    url = "https://api.filevineapp.com/fv-app/v2/utils/GetUserOrgsWithToken"
    headers = {
        "Authorization": f"Bearer {bearer_token}"
    }
    response = requests.post(url, headers=headers)
    response.raise_for_status()
    data = response.json()
    print(data)
    return data["user"]["userId"]["native"], data["orgs"][0]["orgId"]

def get_contacts(token, user_id, org_id, page=1, size=100):
    url = f"https://api.filevineapp.com/fv-app/v2/Contacts?pageSize={size}&pageNumber={page}"
    headers = {
        "Authorization": f"Bearer {token}",
        "x-fv-userid": str(user_id),
        "x-fv-orgid": str(org_id),
        "Accept": "application/json"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json().get("items", [])

def insert_contact(cursor, contact):
    sql = """
        INSERT INTO contacts (
            full_name, first_name, middle_name, last_name, nickname, prefix, suffix,
            company_name, job_title, department, date_of_birth, date_of_death,
            is_company, profile_picture, contact_type, gender, preferred_contact_method
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        contact.get("full_name"),
        contact.get("first_name"),
        contact.get("middle_name"),
        contact.get("last_name"),
        contact.get("nickname"),
        contact.get("prefix"),
        contact.get("suffix"),
        contact.get("company_name"),
        contact.get("job_title"),
        contact.get("department"),
        contact.get("date_of_birth"),
        contact.get("date_of_death"),
        int(contact.get("is_company", False)),
        contact.get("profile_picture"),
        contact.get("contact_type", "Client"),
        contact.get("gender"),
        contact.get("preferred_contact_method"),
    )
    cursor.execute(sql, values)
    return cursor.lastrowid

def insert_detail(cursor, contact_id, detail_type, data):
    sql = "INSERT INTO contact_details (contact_id, detail_type, detail_data) VALUES (%s, %s, %s)"
    cursor.execute(sql, (contact_id, detail_type, json.dumps(data)))

def sync_all_contacts():
    bearer_token = get_bearer_token()
    user_id, org_id = get_user_org_ids(bearer_token)

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    page = 1
    imported = 0

    while True:
        contacts = get_contacts(bearer_token, user_id, org_id, page)
        if not contacts:
            break

        for c in contacts:
            full_name = c.get("name") or f"{c.get('firstName', '')} {c.get('lastName', '')}".strip()
            contact_data = {
                "full_name": full_name,
                "first_name": c.get("firstName"),
                "middle_name": c.get("middleName"),
                "last_name": c.get("lastName"),
                "nickname": c.get("nickname"),
                "prefix": c.get("prefix"),
                "suffix": c.get("suffix"),
                "company_name": c.get("company"),
                "job_title": c.get("jobTitle"),
                "department": c.get("department"),
                "date_of_birth": c.get("dateOfBirth"),
                "date_of_death": c.get("dateOfDeath"),
                "is_company": c.get("isCompany", False),
                "profile_picture": c.get("photoURL"),
                "contact_type": "Company" if c.get("isCompany") else "Client",
                "gender": c.get("gender"),
                "preferred_contact_method": c.get("preferredContactMethod"),
            }

            try:
                contact_id = insert_contact(cursor, contact_data)

                # Emails
                for email in c.get("emails", []):
                    insert_detail(cursor, contact_id, "email", {"type": "personal", "email": email})

                # Phones
                for phone in c.get("phones", []):
                    insert_detail(cursor, contact_id, "phone", {"type": "mobile", "number": phone})

                # Addresses
                for addr in c.get("addresses", []):
                    insert_detail(cursor, contact_id, "address", {
                        "type": addr.get("type", "home"),
                        "line1": addr.get("line1"),
                        "line2": addr.get("line2"),
                        "city": addr.get("city"),
                        "state": addr.get("state"),
                        "postal_code": addr.get("postalCode")
                    })

                imported += 1
            except Exception as e:
                print(f"❌ Failed to import {full_name}: {e}")

        conn.commit()
        print(f"✅ Page {page} processed. Total imported: {imported}")
        page += 1
        time.sleep(0.25)

    cursor.close()
    conn.close()
    print("🎉 Finished syncing Filevine contacts.")

# Execute
sync_all_contacts()