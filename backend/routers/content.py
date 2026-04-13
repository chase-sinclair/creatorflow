from fastapi import APIRouter

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/examples")
async def get_examples():
    return {"message": "coming soon"}


@router.get("/ideas")
async def get_ideas():
    return {"message": "coming soon"}
