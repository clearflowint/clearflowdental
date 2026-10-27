# ClearFlow Dental Clinic — Research Addendum (Batch 37A)

Reviewed 27 October 2026. Source-backed comparison of staff attendance, scheduling and payroll in DentalPin. Not a recommendation to copy every implementation detail.

## 1. Attendance punches vs planned shifts vs payroll
Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/staff_attendance/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/staff_attendance/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/staff_attendance/test_staff_attendance.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/schedules/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/schedules/CLAUDE.md

`AttendanceEvent` is an append-only punch with clinic, user, kind (`in`/`out`), timestamp, note and actor. Same-kind consecutive punches are rejected; a correction is another opposite punch, not an edit. Tests cover tenant membership, role permissions, clinic-local interpretation of naive times, future timestamps, backdated same-kind conflict, open punches and overnight pairing across clinic-local days. The module explicitly has no shift roster, overtime calculation or payroll linkage.

Schedules are a separate normalized module: one clinic weekly template, one professional weekly template per clinic/user, clinic-wide date-range overrides (`closed`/`custom_hours`), professional date-range overrides (`unavailable`/`custom_hours`) and `ScheduleShift` rows. A shift row has optional references to one of four possible parent objects, with a DB CHECK requiring exactly one parent. This preserves referential integrity without storing the entire weekly grid in JSON. Overrides carry start/end dates and reason. The availability resolver returns open work windows; a different function subtracts actual appointments to return contiguous free slots. An open window is not itself a free slot.

### ClearFlow requirements
- Keep planned roster/shift, actual punch events, approved attendance corrections, absence/leave/training, breaks, overtime calculations, payroll inputs and salary payment as separate concepts.
- Store timezone-aware instants and clinic-local business dates. Day totals must pair events in clinic timezone, including overnight shifts; never group by UTC date without a documented rule.
- Every punch has server actor/subject attribution; shared kiosk/PIN mode needs secure clock-terminal identity and member verification, not trust in a body-supplied user ID.
- Define handling for missing pairs, duplicate/out-of-order punches, manager corrections, leave overlap, breaks and DST. Preserve source punch and correction event.
- Availability must account for professional/resource bookings, clinic/professional overrides, holidays, equipment/cabinet capacity and permitted exceptions.

## 2. Payroll: sensitive profile, period state and manual pay run
Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/payroll/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/payroll/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/payroll/test_payroll.py

Three tables: `PayrollProfile` (one per clinic/staff user) with payment type (`monthly`/`hourly`), base amount, currency, encrypted bank/tax fields, active state and country code; `PayrollPeriod` (clinic + YYYY-MM unique period, status); `PayrollEntry` (period/user, gross, deductions, net, notes and timestamps; one entry per user/period). Profile requires clinic membership. Payroll is admin-only, sensitive values are write-only, masked responses expose presence flags and last four characters only. Agent tools intentionally cannot access payroll, and event payloads omit amounts and secrets.

Period lifecycle is `draft → closed → paid`; entries can be changed/deleted only while draft, empty draft periods alone can be deleted, and closed/paid periods are read-only. `net` is stored but validated as `gross − deductions`; monthly/annual reports aggregate. No tax computation, country-specific statutory deductions, attendance-to-pay calculation or bank payment execution is implemented in this reference module. Default currency/examples are Spanish/EU-oriented, not an Indian payroll specification.

### ClearFlow requirements
- Separate staff/employment profile and effective-dated contract terms from payroll period, payroll component/calculation, payslip version, statutory calculation, reimbursement, transfer instruction and payment confirmation.
- Use jurisdiction-specific pay components/rules and versioned formula inputs. Attendance is only a potential source of hours, not proof that payroll calculation occurred.
- Closed payroll periods are immutable except through controlled reversal/amendment. Preserve gross/components/deduction breakdown/net/currency/input formula and rule version/authorizer.
- Sensitive identifiers require field-level encryption, least privilege, masked responses, key-rotation plan and no logging. Never expose raw values to the agent layer.
- Validate components mathematically and reconcile a payroll payment to the actual treasury/bank event. Manual net input alone does not prove payroll is correct.

**End of Batch 37A.**