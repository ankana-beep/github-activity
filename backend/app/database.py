import os
import re
from urllib.parse import quote_plus
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

def get_mongo_uri():
    """
    Constructs a robust MongoDB URI, handling individual variables
    and automatically escaping special characters in passwords.
    """
    # 1. Try individual Atlas variables first (Most reliable)
    user = os.getenv("MONGODB_USER")
    password = os.getenv("MONGODB_PASSWORD")
    cluster = os.getenv("MONGODB_CLUSTER")
    db_name = os.getenv("MONGODB_NAME", "github_activity")
    print("user",user)
    print("password",password)
    print("cluster",cluster)
    print("db_name",db_name)
    if user and password and cluster:
        # Use quote_plus to safely encode password characters
        return f"mongodb+srv://{quote_plus(user)}:{quote_plus(password)}@{cluster}/{db_name}?retryWrites=true&w=majority"

    # 2. Fallback to full URI (often used in Render)
    uri = os.getenv("MONGODB_URI")
    if uri:
        # Automatically escape username and password if found in the URI
        # Pattern: mongodb(+srv)://user:password@host
        match = re.match(r"(mongodb(?:\+srv)?://)([^:]+):([^@]+)@(.+)", uri)
        if match:
            prefix, u, p, rest = match.groups()
            return f"{prefix}{quote_plus(u)}:{quote_plus(p)}@{rest}"
        return uri

    # 3. Last fallback: Local connection
    return "mongodb://localhost:27017/"

# Initialize configuration
uri = get_mongo_uri()
print(" URI:", uri)
client = MongoClient(uri)
db_name = os.getenv("MONGODB_NAME", "github_activity")
db = client[db_name]

# Collection reference
activity_collection = db["activities"]