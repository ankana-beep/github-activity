import os
import requests
from .database import activity_collection
from datetime import datetime

# GitHub API configuration
GITHUB_API = "https://api.github.com/users/{username}/events"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# OAuth Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"

def exchange_code_for_token(code: str):
    """Exchanges GitHub OAuth code for an access token."""
    payload = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code
    }
    headers = {"Accept": "application/json"}
    
    response = requests.post(GITHUB_TOKEN_URL, data=payload, headers=headers)
    if response.status_code != 200:
        return {"error": f"Token exchange failed: {response.text}"}
    
    return response.json()

def get_github_user(token: str):
    """Fetches user profile using OAuth token."""
    headers = {"Authorization": f"token {token}"}
    response = requests.get(GITHUB_USER_URL, headers=headers)
    
    if response.status_code != 200:
        return {"error": "Failed to fetch user profile"}
    
    return response.json()

def get_user_activity(username: str):
    try:
        cached = activity_collection.find_one({"username": username})
        if cached:
            if isinstance(cached.get("activity"), list):
                return cached["activity"]
    except Exception as e:
        print(f"Cache lookup error: {e}")

    try:
        headers = {}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
        response = requests.get(GITHUB_API.format(username=username), headers=headers)
        
        if response.status_code == 404:
            return {"error": "User not found on GitHub"}
        if response.status_code != 200:
            return {"error": f"GitHub API error: {response.status_code}"}
        
        events = response.json()
        
        activity = []
        for event in events:
            if "type" in event and "repo" in event:
                activity.append({
                    "type": event["type"],
                    "repo": event["repo"]["name"],
                    "created_at": event.get("created_at")
                })
                
        activity_collection.update_one(
            {"username": username},
            {
                "$set": {
                    "username": username,
                    "activity": activity,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return activity
    except Exception as e:
        return {"error": str(e)}