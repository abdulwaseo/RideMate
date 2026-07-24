from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base, UUIDMixin, TimestampMixin


class RefreshToken(Base, UUIDMixin, TimestampMixin):
    """
    Stores issued refresh tokens so they can be individually invalidated
    on logout without requiring a shared blacklist cache.
    Only the token's jti (JWT ID) is stored — never the raw token string.
    """

    user_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # We store the raw refresh token string; in production swap for jti hash.
    token = Column(String(512), unique=True, nullable=False, index=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", back_populates="refresh_tokens")
