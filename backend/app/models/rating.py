from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin


class Rating(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Reputation Rating and Review entity.
    Allows ride participants (passengers and drivers) to rate and review each other
    upon ride completion. Supports soft deletion.
    """

    ride_id = Column(
        ForeignKey("ride.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewer_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewee_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    score = Column(Integer, nullable=False)
    review = Column(String(1000), nullable=True)

    ride = relationship("Ride")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])
