import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models import Room
from routers import rooms as rooms_router


@pytest.mark.anyio
async def test_get_rooms_empty(test_db: AsyncSession):
    """Test GET /api/rooms returns empty list when no rooms exist"""
    result = await rooms_router.get_rooms(db=test_db)
    assert result == []


@pytest.mark.anyio
async def test_get_rooms_with_data(test_db: AsyncSession):
    """Test GET /api/rooms returns rooms in sort order"""
    # Create test room
    room = Room(
        name="Living Room",
        icon="Sofa",
        sort_order=1,
        is_active=True
    )
    test_db.add(room)
    await test_db.commit()
    await test_db.refresh(room)

    result = await rooms_router.get_rooms(db=test_db)
    assert len(result) == 1
    assert result[0].name == "Living Room"
    assert result[0].is_active is True
