import os
import ssl as ssl_module
from pathlib import Path
from pydantic_settings import BaseSettings
import dotenv

# Load .env from EvalServer root (parent of src/)
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    dotenv.load_dotenv(env_path)

class Settings(BaseSettings):
    db_user: str
    db_password: str
    db_host: str
    db_port: str
    db_name: str
    # TLS for managed PostgreSQL (Aiven requires it). asyncpg ignores ?sslmode= in
    # the URL, so SSL must be passed via connect_args (see connect_args below).
    db_ssl: str = "false"
    reject_unauthorized: str = "false"
    # Path to the CA cert (Aiven's ca.pem). When set, the server cert is verified
    # strictly against it — the production-correct setting.
    db_ca_cert: str = ""

    @property
    def sqlalchemy_database_url(self):
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def connect_args(self) -> dict:
        """asyncpg connect args: pin the search_path and, when DB_SSL=true, attach
        an SSL context. DB_CA_CERT enables strict verification against that CA
        (production). Without a CA cert, REJECT_UNAUTHORIZED=false encrypts without
        verifying the server cert (dev only)."""
        args: dict = {"server_settings": {"search_path": "verifywise"}}
        if str(self.db_ssl).lower() == "true":
            if self.db_ca_cert:
                # Verify the server cert against the provided CA (check_hostname
                # stays on — strict verify-full).
                ctx = ssl_module.create_default_context(cafile=self.db_ca_cert)
            else:
                ctx = ssl_module.create_default_context()
                if str(self.reject_unauthorized).lower() != "true":
                    ctx.check_hostname = False
                    ctx.verify_mode = ssl_module.CERT_NONE
            args["ssl"] = ctx
        return args

settings = Settings() # type: ignore
