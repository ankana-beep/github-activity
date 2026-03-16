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

    user = os.getenv("MONGODB_USER")
    password = os.getenv("MONGODB_PASSWORD")
    cluster = os.getenv("MONGODB_CLUSTER")
    db_name = os.getenv("MONGODB_NAME", "github_activity")

    if user and password and cluster:
        return f"mongodb+srv://{quote_plus(user)}:{quote_plus(password)}@{cluster}/{db_name}?retryWrites=true&w=majority"

    uri = os.getenv("MONGODB_URI")
    if uri:
        match = re.match(r"(mongodb(?:\+srv)?://)([^:]+):([^@]+)@(.+)", uri)
        if match:
            prefix, u, p, rest = match.groups()
            return f"{prefix}{quote_plus(u)}:{quote_plus(p)}@{rest}"
        return uri

    return "mongodb://localhost:27017/"


uri = get_mongo_uri()
client = MongoClient(uri)
db_name = os.getenv("MONGODB_NAME", "github_activity")
db = client[db_name]


activity_collection = db["activities"]