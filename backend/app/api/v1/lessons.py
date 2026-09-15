from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import LessonLearned
from app.schemas.dtos import LessonLearnedCreate, LessonLearnedResponse

router = APIRouter(prefix="/lessons", tags=["Lessons Learned"])

@router.get("", response_model=List[LessonLearnedResponse])
def list_lessons(
    category: Optional[str] = Query(None),
    active_only: bool = Query(True),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = select(LessonLearned)
    if active_only:
        query = query.where(LessonLearned.active == True)
    if category:
        query = query.where(LessonLearned.category == category)
    query = query.order_by(desc(LessonLearned.frequency)).limit(limit)
    return db.execute(query).scalars().all()

@router.post("", response_model=LessonLearnedResponse, status_code=201)
def create_lesson(lesson_in: LessonLearnedCreate, db: Session = Depends(get_db)):
    lesson = LessonLearned(**lesson_in.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson

@router.patch("/{lesson_id}/toggle", response_model=LessonLearnedResponse)
def toggle_lesson_status(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.get(LessonLearned, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson.active = not lesson.active
    db.commit()
    db.refresh(lesson)
    return lesson
