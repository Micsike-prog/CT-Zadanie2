from fastapi import APIRouter, HTTPException, Request, status

from ..auth import create_access_token, verify_password
from ..db import get_conn
from ..rate_limit import limiter
from ..schemas import LoginRequest, LoginResponse


router = APIRouter(tags=["auth"])


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest) -> LoginResponse:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, password_hash FROM users WHERE email = %s",
                (payload.email,),
            )
            user = cur.fetchone()

    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token, expires_in = create_access_token(user)
    return LoginResponse(
        access_token=token,
        expires_in=expires_in,
        user={"id": str(user["id"]), "email": user["email"]},
    )
