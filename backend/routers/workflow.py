from fastapi import APIRouter

router = APIRouter(prefix="/api/workflow", tags=["workflow"])


@router.post("/generate")
async def workflow_generate():
    return {"message": "coming soon"}


@router.post("/refine")
async def workflow_refine():
    return {"message": "coming soon"}


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    return {"message": "coming soon"}


@router.post("/{workflow_id}/share")
async def share_workflow(workflow_id: str):
    return {"message": "coming soon"}


@router.get("/{workflow_id}/export")
async def export_workflow(workflow_id: str):
    return {"message": "coming soon"}
