"""add date_of_birth to user table

Revision ID: 7b1c3d4e5f6a
Revises: 59f4ad827ce7
Create Date: 2026-07-26 15:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b1c3d4e5f6a'
down_revision: Union[str, Sequence[str], None] = '59f4ad827ce7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add date_of_birth column to user table."""
    op.add_column('user', sa.Column('date_of_birth', sa.Date(), nullable=True))


def downgrade() -> None:
    """Remove date_of_birth column from user table."""
    op.drop_column('user', 'date_of_birth')
