from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Centraliza as configurações carregadas do ambiente/.env.
    database_url: str = "postgresql+psycopg2://johndoe:randompassword@localhost:5433/mydb"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    collection_timeout_seconds: int = 30
    collection_prefix_limit: int = 50

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
