from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar('T')

class SuccessResponse(BaseModel, Generic[T]):
    """Standard generic API response payload for successful transactions."""
    success: bool = True
    message: str
    data: Optional[T] = None

class ErrorResponse(BaseModel):
    """Standard API response payload for failed requests or validation errors."""
    success: bool = False
    message: str
    errors: List[Any] = []
