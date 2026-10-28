import unittest
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from f.dental.appointment_reminder_candidates import main


class ReminderCandidateTests(unittest.TestCase):
    def setUp(self):
        self.now = "2026-10-28T10:00:00+00:00"
        self.rows = [
            {"$id": "a1", "tenantId": "clinic-a", "patientId": "p1", "startsAt": "2026-10-28T18:00:00Z", "status": "scheduled"},
            {"$id": "a2", "tenantId": "clinic-a", "patientId": "p2", "startsAt": "2026-10-29T18:00:00Z", "status": "scheduled"},
            {"$id": "a3", "tenantId": "clinic-a", "patientId": "p3", "startsAt": "2026-10-28T12:00:00Z", "status": "cancelled"},
            {"$id": "a4", "tenantId": "clinic-a", "patientId": "p4", "startsAt": "bad-date", "status": "confirmed"},
        ]

    def test_only_scheduled_or_confirmed_in_window_are_candidates(self):
        result = main(json.dumps(self.rows), 'clinic-a', self.now, 24)
        self.assertEqual(result["candidateCount"], 1)
        self.assertEqual(result["candidates"][0]["appointmentId"], "a1")
        self.assertEqual(result["sent"], 0)

    def test_candidate_has_no_contact_or_message_content(self):
        result = main(self.rows, 'clinic-a', self.now, 24)
        self.assertNotIn("phone", result["candidates"][0])
        self.assertNotIn("message", result["candidates"][0])

    def test_timezone_is_required(self):
        with self.assertRaises(ValueError):
            main("[]", "clinic-a", "2026-10-28T10:00:00", 24)

    def test_window_is_bounded(self):
        with self.assertRaises(ValueError):
            main('[]', 'clinic-a', self.now, 1000)

    def test_other_tenants_are_excluded(self):
        mixed = self.rows + [{"$id": "foreign", "tenantId": "clinic-b", "patientId": "p9", "startsAt": "2026-10-28T11:00:00Z", "status": "scheduled"}]
        result = main(mixed, 'clinic-a', self.now, 24)
        self.assertEqual([row['appointmentId'] for row in result['candidates']], ['a1'])

    def test_tenant_is_required(self):
        with self.assertRaises(ValueError):
            main(json.dumps(self.rows), '', self.now, 24)


if __name__ == "__main__":
    unittest.main()
