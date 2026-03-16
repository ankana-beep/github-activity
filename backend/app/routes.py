from fastapi import APIRouter, Query
from .services import get_user_activity, exchange_code_for_token, get_github_user
import os

router = APIRouter()


@router.get("/activity/{username}")
def user_activity(username: str):
    return get_user_activity(username)

@router.get("/auth/login")
def login():
    client_id = os.getenv("GITHUB_CLIENT_ID")
    return {
        "url": f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=read:user"
    }

@router.get("/auth/callback")
def auth_callback(code: str = Query(...)):
    token_data = exchange_code_for_token(code)
    if "error" in token_data:
        return token_data
    
    token = token_data.get("access_token")
    user_data = get_github_user(token)
    
    return {
        "access_token": token,
        "user": {
            "login": user_data.get("login"),
            "avatar_url": user_data.get("avatar_url"),
            "name": user_data.get("name")
        }
    }