"""initial schema

Revision ID: 20260409_0001
Revises:
Create Date: 2026-04-09 00:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260409_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=80), nullable=False, unique=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "workers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("role", sa.String(length=80), nullable=False),
        sa.Column("fatigue_level", sa.Float(), nullable=False, server_default="0"),
        sa.Column("risk_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("position_x", sa.Float(), nullable=False, server_default="0"),
        sa.Column("position_y", sa.Float(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_workers_status", "workers", ["status"])
    op.create_index("ix_workers_role", "workers", ["role"])
    op.create_index("ix_workers_risk_score", "workers", ["risk_score"])

    op.create_table(
        "hazards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("type", sa.String(length=60), nullable=False),
        sa.Column("severity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("center_x", sa.Float(), nullable=False, server_default="0"),
        sa.Column("center_y", sa.Float(), nullable=False, server_default="0"),
        sa.Column("radius", sa.Float(), nullable=True),
        sa.Column("polygon", sa.JSON(), nullable=True),
        sa.Column("active_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_hazards_type", "hazards", ["type"])
    op.create_index("ix_hazards_severity", "hazards", ["severity"])

    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("worker_id", sa.Integer(), sa.ForeignKey("workers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("hazard_id", sa.Integer(), sa.ForeignKey("hazards.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", sa.String(length=80), nullable=False),
        sa.Column("severity", sa.String(length=40), nullable=False),
        sa.Column("message", sa.String(length=300), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_alerts_type", "alerts", ["type"])
    op.create_index("ix_alerts_severity", "alerts", ["severity"])
    op.create_index("ix_alerts_timestamp", "alerts", ["timestamp"])

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("worker_id", sa.Integer(), sa.ForeignKey("workers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("hazard_id", sa.Integer(), sa.ForeignKey("hazards.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("details", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_events_type", "events", ["event_type"])
    op.create_index("ix_events_timestamp", "events", ["timestamp"])

    op.create_table(
        "simulation_state",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("state_key", sa.String(length=80), nullable=False, unique=True),
        sa.Column("state_value", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_simulation_state_key", "simulation_state", ["state_key"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_simulation_state_key", table_name="simulation_state")
    op.drop_table("simulation_state")

    op.drop_index("ix_events_timestamp", table_name="events")
    op.drop_index("ix_events_type", table_name="events")
    op.drop_table("events")

    op.drop_index("ix_alerts_timestamp", table_name="alerts")
    op.drop_index("ix_alerts_severity", table_name="alerts")
    op.drop_index("ix_alerts_type", table_name="alerts")
    op.drop_table("alerts")

    op.drop_index("ix_hazards_severity", table_name="hazards")
    op.drop_index("ix_hazards_type", table_name="hazards")
    op.drop_table("hazards")

    op.drop_index("ix_workers_risk_score", table_name="workers")
    op.drop_index("ix_workers_role", table_name="workers")
    op.drop_index("ix_workers_status", table_name="workers")
    op.drop_table("workers")
