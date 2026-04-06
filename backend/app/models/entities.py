import os
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.extensions import db

DATABASE_URL = os.getenv("DATABASE_URL", "")
USE_SQLITE_GEOMETRY = DATABASE_URL.startswith("sqlite")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Organization(TimestampMixin, db.Model):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(Enum("admin", "engineer", "viewer", name="user_roles"), nullable=False)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)

    organization = relationship("Organization", back_populates="users")


class Project(TimestampMixin, db.Model):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("draft", "active", "completed", "archived", name="project_status"), nullable=False, default="draft"
    )
    crs: Mapped[str] = mapped_column(String(32), nullable=False, default="EPSG:32644")
    capacity_mw: Mapped[float | None] = mapped_column(Float)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    organization = relationship("Organization", back_populates="projects")
    revisions = relationship("Revision", back_populates="project", cascade="all, delete-orphan")
    layers = relationship("Layer", back_populates="project", cascade="all, delete-orphan")
    features = relationship("Feature", back_populates="project", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    terrains = relationship("TerrainData", back_populates="project", cascade="all, delete-orphan")


class Revision(TimestampMixin, db.Model):
    __tablename__ = "revisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    project = relationship("Project", back_populates="revisions")


class Layer(TimestampMixin, db.Model):
    __tablename__ = "layers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    layer_type: Mapped[str] = mapped_column(String(60), nullable=False)
    visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    style: Mapped[dict | None] = mapped_column(JSON)
    z_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project = relationship("Project", back_populates="layers")
    features = relationship("Feature", back_populates="layer")


class Feature(TimestampMixin, db.Model):
    __tablename__ = "features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    layer_id: Mapped[int] = mapped_column(ForeignKey("layers.id"), nullable=False)
    feature_type: Mapped[str] = mapped_column(String(60), nullable=False)
    sub_type: Mapped[str | None] = mapped_column(String(60))
    name: Mapped[str | None] = mapped_column(String(120))
    tag: Mapped[str | None] = mapped_column(String(120))
    geometry: Mapped[object] = mapped_column(
        JSON if USE_SQLITE_GEOMETRY else Geometry(geometry_type="GEOMETRY", srid=4326),
        nullable=False,
    )
    geometry_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    properties: Mapped[dict | None] = mapped_column(JSON)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("features.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    project = relationship("Project", back_populates="features")
    layer = relationship("Layer", back_populates="features")


class Job(TimestampMixin, db.Model):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    module_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("pending", "running", "done", "failed", name="job_status"), nullable=False, default="pending"
    )
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    input_payload: Mapped[dict | None] = mapped_column(JSON)
    result_payload: Mapped[dict | None] = mapped_column(JSON)
    error_message: Mapped[str | None] = mapped_column(Text)

    project = relationship("Project", back_populates="jobs")


class TableTypeConfig(TimestampMixin, db.Model):
    __tablename__ = "table_type_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False)


class Report(TimestampMixin, db.Model):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    report_type: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)

    project = relationship("Project", back_populates="reports")


class TerrainData(TimestampMixin, db.Model):
    __tablename__ = "terrain_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(140), nullable=False)
    source_type: Mapped[str] = mapped_column(String(80), nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    project = relationship("Project", back_populates="terrains")


class AuditLog(TimestampMixin, db.Model):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    details: Mapped[dict | None] = mapped_column(JSON)