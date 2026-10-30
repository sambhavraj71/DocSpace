import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models

from routers import auth, documents


app = FastAPI(
    title="DocSpace API",
    description="Collaborative Document Management API",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(documents.router)

frontend_url = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5174"
)

allowed_origins = [
    frontend_url,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(allowed_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def home():
    return {
        "message": "Welcome to DocSpace API",
        "status": "Running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}