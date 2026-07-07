"""Test per next_due_from_recurrence e calculate_next_date."""
from datetime import date, timedelta
from types import SimpleNamespace

from logic.scheduling import next_due_from_recurrence, calculate_next_date


def _task(tags=None, frequency_days=7):
    """Task minimale: next_due_from_recurrence legge solo .tags e .frequency_days."""
    return SimpleNamespace(tags=tags, frequency_days=frequency_days)


class TestNextDueFromRecurrence:
    """Giorni fissi (tag 'day:N', N in convenzione JS: 0=Dom..6=Sab):
    prossimo giorno strettamente dopo la data base."""

    def test_giovedi_to_lunedi(self):
        """Task fisso lunedì+giovedì (day:1, day:4): da giovedì, il prossimo è lunedì (4 giorni)."""
        base = date(2026, 7, 2)  # giovedì
        task = _task(tags=["day:1", "day:4"])
        result = next_due_from_recurrence(task, base)
        expected = date(2026, 7, 6)  # lunedì
        assert result == expected, f"Atteso {expected}, ottenuto {result}"

    def test_lunedi_to_giovedi(self):
        """Task fisso lunedì+giovedì (day:1, day:4): da lunedì, il prossimo è giovedì (3 giorni)."""
        base = date(2026, 7, 6)  # lunedì
        task = _task(tags=["day:1", "day:4"])
        result = next_due_from_recurrence(task, base)
        expected = date(2026, 7, 9)  # giovedì
        assert result == expected, f"Atteso {expected}, ottenuto {result}"
        assert result.weekday() == 3  # giovedì (Python: 0=lun..6=dom)

    def test_nessun_tag_usa_intervallo(self):
        """Senza tag 'day:', ricade sull'intervallo frequency_days."""
        base = date(2026, 6, 15)
        task = _task(tags=None, frequency_days=21)
        result = next_due_from_recurrence(task, base)
        assert result == calculate_next_date(base, 21, "real")


class TestCalculateNextDate:
    """Intervallo semplice, con slittamento weekend."""

    def test_interval_21_days(self):
        base = date(2026, 6, 15)  # lunedì; +21gg = lunedì, nessuno slittamento
        result = calculate_next_date(base, 21)
        expected = base + timedelta(days=21)
        assert result == expected

    def test_interval_7_days(self):
        base = date(2026, 6, 1)  # lunedì; +7gg = lunedì, nessuno slittamento
        result = calculate_next_date(base, 7)
        expected = base + timedelta(days=7)
        assert result == expected

    def test_weekend_slitta(self):
        """Se la scadenza calcolata cade di sabato slitta a lunedì (+2gg)."""
        base = date(2026, 7, 1)  # mercoledì; +3gg = sabato 2026-07-04 -> lunedì 2026-07-06
        result = calculate_next_date(base, 3)
        assert result.weekday() not in (5, 6)
        assert result == date(2026, 7, 6)  # lunedì
