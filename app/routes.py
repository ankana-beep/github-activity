from fastapi import APIRouter
from .services import get_user_activity

router = APIRouter()


@router.get("/activity/{username}")
def user_activity(username: str):
    return get_user_activity(username)