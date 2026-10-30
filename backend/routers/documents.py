
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from database import get_db
from models import Document, DocumentShare, User
from schemas import DocumentCreate, DocumentUpdate, ShareCreate
from auth_utils import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])


# Check whether user can access a document
def get_document_access(document_id, current_user, db):
    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # Owner has full access
    if document.owner_id == current_user.id:
        return document, "owner"

    # Check shared permission
    share = db.query(DocumentShare).filter(
        DocumentShare.document_id == document_id,
        DocumentShare.user_id == current_user.id
    ).first()

    if not share:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this document"
        )

    return document, share.permission


# Create document
@router.post("/")
def create_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Document title cannot be empty"
        )

    document = Document(
        title=data.title.strip(),
        content=data.content or "",
        owner_id=current_user.id
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


# Get owned documents
@router.get("/")
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    documents = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.updated_at.desc())
        .all()
    )

    return documents


# Get recent owned documents
@router.get("/recent")
def get_recent_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    documents = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.updated_at.desc())
        .limit(10)
        .all()
    )

    return documents


# Get documents shared with current user
@router.get("/shared-with-me")
def get_shared_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = (
        db.query(Document, DocumentShare.permission, User.name)
        .join(
            DocumentShare,
            Document.id == DocumentShare.document_id
        )
        .join(
            User,
            Document.owner_id == User.id
        )
        .filter(DocumentShare.user_id == current_user.id)
        .order_by(Document.updated_at.desc())
        .all()
    )

    return [
        {
            "id": document.id,
            "title": document.title,
            "content": document.content,
            "owner_id": document.owner_id,
            "owner_name": owner_name,
            "permission": permission,
            "created_at": document.created_at,
            "updated_at": document.updated_at
        }
        for document, permission, owner_name in results
    ]


# Get a single accessible document
@router.get("/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document, permission = get_document_access(
        document_id, current_user, db
    )

    return {
        "id": document.id,
        "title": document.title,
        "content": document.content,
        "owner_id": document.owner_id,
        "permission": permission,
        "created_at": document.created_at,
        "updated_at": document.updated_at
    }


# Update document
@router.put("/{document_id}")
def update_document(
    document_id: int,
    data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document, permission = get_document_access(
        document_id, current_user, db
    )

    # Only owner and editor can update
    if permission not in ["owner", "editor"]:
        raise HTTPException(
            status_code=403,
            detail="You have viewer-only access"
        )

    if data.title is not None:
        if not data.title.strip():
            raise HTTPException(
                status_code=400,
                detail="Document title cannot be empty"
            )

        document.title = data.title.strip()

    if data.content is not None:
        document.content = data.content

    db.commit()
    db.refresh(document)

    return {
        "message": "Document updated successfully",
        "document": document
    }


# Share document with another user
@router.post("/{document_id}/share")
def share_document(
    document_id: int,
    data: ShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found or you are not the owner"
        )

    permission = data.permission.lower().strip()

    if permission not in ["viewer", "editor"]:
        raise HTTPException(
            status_code=400,
            detail="Permission must be viewer or editor"
        )

    # Find recipient by email
    recipient = db.query(User).filter(
        func.lower(User.email) == data.email.lower()
    ).first()

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="User with this email is not registered"
        )

    if recipient.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot share a document with yourself"
        )

    # Check existing share
    existing_share = db.query(DocumentShare).filter(
        DocumentShare.document_id == document_id,
        DocumentShare.user_id == recipient.id
    ).first()

    if existing_share:
        existing_share.permission = permission
        message = "Sharing permission updated successfully"
    else:
        new_share = DocumentShare(
            document_id=document_id,
            user_id=recipient.id,
            permission=permission
        )

        db.add(new_share)
        message = "Document shared successfully"

    db.commit()

    return {
        "message": message,
        "document_id": document_id,
        "shared_with": recipient.email,
        "permission": permission
    }


# Remove a user's access to a document
@router.delete("/{document_id}/share/{user_id}")
def remove_document_share(
    document_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found or you are not the owner"
        )

    share = db.query(DocumentShare).filter(
        DocumentShare.document_id == document_id,
        DocumentShare.user_id == user_id
    ).first()

    if not share:
        raise HTTPException(
            status_code=404,
            detail="Share not found"
        )

    db.delete(share)
    db.commit()

    return {
        "message": "Document access removed successfully"
    }


# Delete document (owner only)
@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found or you are not the owner"
        )

    db.query(DocumentShare).filter(
        DocumentShare.document_id == document_id
    ).delete()

    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully"
    }
