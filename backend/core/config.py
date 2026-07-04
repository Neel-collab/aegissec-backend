from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AegisSec API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    JWT_SECRET: str = "supersecretkey_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "aegissec"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"
    GEMINI_API_KEY: str = ""

    model_config = {"env_file": ".env"}

settings = Settings()
