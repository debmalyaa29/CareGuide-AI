from pydantic import BaseModel, Field
from typing import Optional


class UserPreferencesUpdate(BaseModel):
    preferred_explanation_style: Optional[str] = Field(None, pattern="^(simple|detailed|technical)$")
    preferred_response_length: Optional[str] = Field(None, pattern="^(short|medium|long)$")
    memory_enabled: Optional[bool] = None


class UserPreferencesResponse(BaseModel):
    user_id: str
    preferred_explanation_style: str = "simple"
    preferred_response_length: str = "medium"
    memory_enabled: bool = True
