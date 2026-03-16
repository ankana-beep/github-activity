import os
import requests
from .database import activity_collection
from datetime import datetime

# GitHub API configuration
GITHUB_API = "https://api.github.com/users/{username}/events"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

def get_user_activity(username: str):
    # Check cache
    try:
        cached = activity_collection.find_one({"username": username})
        if cached:
            # Basic validation to ensure cached data is an array
            if isinstance(cached.get("activity"), list):
                return cached["activity"]
    except Exception as e:
        print(f"Cache lookup error: {e}")

    # Fetch from GitHub
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
            # We only care about events with a type and repo info
            if "type" in event and "repo" in event:
                activity.append({
                    "type": event["type"],
                    "repo": event["repo"]["name"],
                    "created_at": event.get("created_at")
                })
        
        # json_data = json.dumps(activity)
        # print("activity",json_data)

        # Save to cache
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