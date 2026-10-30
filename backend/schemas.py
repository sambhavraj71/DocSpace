from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class DocumentCreate(BaseModel):
    title: str
    content: Optional[str] = ""


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class ShareCreate(BaseModel):
    email: EmailStr
    permission: str = "viewer"