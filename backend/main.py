from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import brainstorm, workflow, content

load_dotenv()

app = FastAPI(title="CreatorFlow API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
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
