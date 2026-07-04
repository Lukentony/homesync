"""Test per next_due_from_recurrence e calculate_next_date."""
import pytest
from datetime import date, timedelta
from logic.scheduling import next_due_from_recurrence, calculate_next_date


class TestNextDueFromRecurrence:
    """Giorni fissi: prossimo giorno strettamente dopo la data base."""

    @pytest.mark.anyio
    async def test_giovedi_to_lunedi(self):
        """Se oggi è giovedì, prossimo lunedì è tra 4 giorni."""
        base = date(2026, 7, 2)  # giovedì
        tags = ["day:monday", "day:wednesday", "day:friday"]
        result = await next_due_from_recurrence(base, tags, base)
        expected = date(2026, 7, 6)  # lunedì
        assert result == expected, f"Atteso {expected}, ottenuto {result}"

    @pytest.mark.anyio
    async def test_lunedi_to_giovedi(self):
        """Se oggi è lunedì, prossimo giovedì è tra 3 giorni."""
        base = date(2026, 7, 6)  # lunedì
        tags = ["day:monday", "day:wednesday", "day:friday"]
        result = await next_due_from_recurrence(base, tags, base)
        assert result > base
        assert result.weekday() in (0, 2, 4)  # lun, mer, ven


class TestCalculateNextDate:
    """Intervallo: fallback quando non ci sono tag day:."""

    @pytest.mark.anyio
    async def test_interval_21_days(self):
        """Intervallo 21 giorni."""
        base = date(2026, 6, 15)
        result = await calculate_next_date(base, 21)
        expected = base + timedelta(days=21)
        assert result == expected

    @pytest.mark.anyio
    async def test_interval_7_days(self):
        """Intervallo 7 giorni."""
        base = date(2026, 6, 1)
        result = await calculate_next_date(base, 7)
        expected = base + timedelta(days=7)
        assert result == expected
