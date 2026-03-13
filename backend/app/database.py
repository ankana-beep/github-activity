import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# Get variables for Atlas connection
user = os.getenv("MONGODB_USER")
password = os.getenv("MONGODB_PASSWORD")
cluster = os.getenv("MONGODB_CLUSTER")
db_name = os.getenv("MONGODB_NAME", "github_activity")

if user and password and cluster:
    # Use formatted string to handle special characters in password safely
    uri = f"mongodb+srv://{quote_plus(user)}:{quote_plus(password)}@{cluster}/{db_name}?retryWrites=true&w=majority"
else:
    # Fallback to direct URI from .env or local default
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")

client = MongoClient(uri)
db = client[db_name]
activity_collection = db["activities"]