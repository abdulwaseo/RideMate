from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class RatingCreate(BaseModel):
    """Payload to rate a user after ride completion."""

    ride_id: UUID = Field(..., description="Completed Ride ID.")
    reviewee_id: UUID = Field(..., description="ID of user being rated (Driver or Passenger).")
    score: int = Field(
        ...,
        ge=1,
        le=5,
        examples=[5],
        description="Rating score from 1 (lowest) to 5 (highest).",
    )
    review: Optional[str] = Field(
        None,
        max_length=1000,
        examples=["Punctual driver, smooth driving experience."],
        description="Optional text review (up to 1000 characters).",
    )

    @field_validator("review")
    @classmethod
    def clean_review_text(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            # Basic placeholder profanity clean if needed
            bad_words = ["foolish_profanity_placeholder"]
            for bw in bad_words:
                v = v.replace(bw, "***")
        return v


class RatingUpdate(BaseModel):
    """Payload to update an existing rating within 24 hours."""

    score: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = Field(None, max_length=1000)


class RatingResponse(BaseModel):
    """Output representation of a Rating/Review."""

    id: UUID
    ride_id: UUID
    reviewer_id: UUID
    reviewee_id: UUID
    score: int
    review: Optional[str] = None
    reviewer_name: Optional[str] = None
    reviewee_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserRatingSummary(BaseModel):
    """Public rating summary and reviews for a user."""

    user_id: UUID
    user_name: str
    average_rating: float
    total_ratings: int
    recent_reviews: List[RatingResponse] = []

    class Config:
        from_attributes = True
