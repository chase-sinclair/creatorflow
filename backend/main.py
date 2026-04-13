from dotenv import load_dotenv
load_dotenv()  # Must run before any module-level Anthropic/Supabase/Redis clients are instantiated

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import brainstorm, workflow, content

app = FastAPI(title="CreatorFlow API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(brainstorm.router)
app.include_router(workflow.router)
app.include_router(content.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
