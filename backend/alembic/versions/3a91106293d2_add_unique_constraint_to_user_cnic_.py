"""add_unique_constraint_to_user_cnic_number

Revision ID: 3a91106293d2
Revises: 7b1c3d4e5f6a
Create Date: 2026-07-26 16:53:26.377613

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a91106293d2'
down_revision: Union[str, Sequence[str], None] = '7b1c3d4e5f6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint("uq_user_cnic_number", "user", ["cnic_number"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_user_cnic_number", "user", type_="unique")
