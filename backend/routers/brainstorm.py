from fastapi import APIRouter

router = APIRouter(prefix="/api/brainstorm", tags=["brainstorm"])


@router.post("/start")
async def brainstorm_start():
    return {"message": "coming soon"}


@router.post("/respond")
async def brainstorm_respond():
    return {"message": "coming soon"}
