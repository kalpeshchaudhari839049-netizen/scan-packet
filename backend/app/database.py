import os
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, JSON, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backend/scans.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class ScanReport(Base):
    __tablename__ = "scan_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    original_filename: Mapped[str] = mapped_column(String(255))
    upload_path: Mapped[str] = mapped_column(String(1024))
    overall_status: Mapped[str] = mapped_column(String(32))
    compliance_score: Mapped[float] = mapped_column(Float)
    ocr_confidence: Mapped[float] = mapped_column()
    is_food: Mapped[bool] = mapped_column(default=False)
    extracted_fields: Mapped[dict] = mapped_column(JSON)
    rule_results: Mapped[list] = mapped_column(JSON)
    raw_text: Mapped[str] = mapped_column()
    is_demo: Mapped[bool] = mapped_column(default=False)
    confidence_source: Mapped[str] = mapped_column(String(48), default="live_ocr")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
