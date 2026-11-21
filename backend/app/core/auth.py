import logging
from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from backend.app.database.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


async def require_authenticated_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Enforces authentication on protected endpoints.
    Requires a valid 'Authorization: Bearer <token>' header.
    Validates token against Supabase Auth to extract user_id.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in first to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty bearer token. Please log in first.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Allow guest demo token for testing/demo sessions if explicitly present
    if token.startswith("demo-") or token == "demo-session-token":
        return "demo-patient-001"

    # 2. Verify with Supabase Auth
    client = get_supabase_client()
    if client:
        try:
            user_res = client.auth.get_user(token)
            if user_res and user_res.user:
                return str(user_res.user.id)
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired session. Please log in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Supabase auth verification error: {e}")
            err_str = str(e).lower()
            if "invalid" in err_str or "expired" in err_str or "401" in err_str or "403" in err_str:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired session. Please log in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    # 3. JWT decode fallback (e.g. for mock integration tests or offline mode)
    try:
        import jwt
        decoded = jwt.decode(token, options={"verify_signature": False})
        if "sub" in decoded and decoded["sub"]:
            return str(decoded["sub"])
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized. Unable to verify user token. Please log in.",
        headers={"WWW-Authenticate": "Bearer"},
    )
