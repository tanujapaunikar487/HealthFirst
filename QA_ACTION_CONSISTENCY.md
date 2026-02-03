# QA Test Script: Action Consistency Audit

> **Purpose**: Verify all user-facing actions follow the global pattern:
> - **No table actions** — row click opens detail view
> - **Detail view** = 1 Primary button + ⋮ menu (ordered by importance, destructive last + confirm)

---

## Global Rules to Enforce

| Rule | Description | Verification |
|------|-------------|--------------|
| **R1** | No table actions/icons — row click opens detail view | Table cells have no buttons/dropdowns except visual indicator |
| **R2** | Detail view = 1 Primary button + ⋮ menu | Exactly one prominent Button, one DropdownMenu |
| **R3** | Menu ordered by importance, destructive last | Non-destructive first, separator before destructive |
| **R4** | Destructive actions require confirmation | Delete, Cancel show confirm dialog |
| **R5** | Nested sheets show Back arrow | Sheet-on-sheet has ChevronLeft to return |
| **R6** | Primary action is status-based | Button changes based on entity status |
| **R7** | No duplicate "View Details" in menu | Menu never duplicates row click behavior |
| **R8** | Consistent labels across app | Same action = same label everywhere |

---

## Action Consistency Matrix

### Appointments

| State | Opens | Primary Button | Menu Actions |
|-------|-------|----------------|--------------|
| **Upcoming (≤48h)** | Sheet | Check-in | Add to Calendar, Get Directions*, Share, Reschedule, Cancel |
| **Upcoming (>48h)** | Sheet | Reschedule / Join Video | Add to Calendar, Get Directions*, Share, Cancel |
| **Past** | Page | Book Again | Share |
| **Cancelled** | Sheet | Book Again | Share |

*Get Directions only for in-person appointments

### Health Records

| Category | Opens | Primary Button | Menu Actions |
|----------|-------|----------------|--------------|
| **lab_report / vitals / immunization** | Page | Download | View Appointment*, Share, Add to Health App, Request Amendment |
| **Other categories** | Page | Download | View Appointment*, Share, Request Amendment |

*View Appointment only if `appointment_id` exists

### Insurance — Policies

| State | Opens | Primary Button | Menu Actions |
|-------|-------|----------------|--------------|
| **Active** | Page | Use for Admission | Download, Set as Primary, Edit, Share, Delete |

### Insurance — Claims

| Status | Opens | Primary Button | Menu Actions |
|--------|-------|----------------|--------------|
| **submitted / under_review** | Page | Check Status | Download, Share |
| **rejected** | Page | Check Status | Download, Appeal, Share |
| **approved / paid** | Page | Check Status | Download, Share |

### Billing

| Status | Opens | Primary Button | Menu Actions |
|--------|-------|----------------|--------------|
| **payable / overdue** | Page | Pay Now ₹{amount} | Download Invoice, Payment Plan, Raise Dispute, Share, Contact Support |
| **emi** | Page | Pay EMI ₹{amount} | Download Invoice, Share, Contact Support |
| **paid / covered / reimbursed** | Page | Download Receipt | Download Invoice, Reimbursement Letter*, View Appointment, Share |
| **disputed** | Page | View Status | Download Invoice, Cancel Dispute*, Share, Contact Support |

*Reimbursement Letter only if `insurance_details` exists
*Cancel Dispute only if dispute status = Under Review

---

## Test Cases

### TC-001: Table Row Click Navigation

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click table row | Detail opens (sheet/page per matrix) |
| 2 | Click visual indicator (chevron) | Same as row click (no dropdown) |
| 3 | Inspect row HTML | No `<Button>` or `<DropdownMenu>` in cells |

**Sections to test**: Appointments (all 3 tabs), Health Records (all 4 tabs), Insurance (Policies + Claims), Billing (all tabs)

### TC-002: Primary Button by Status

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open detail view | ONE primary Button visible (not variant="outline") |
| 2 | Verify label | Matches matrix for current status |
| 3 | Click button | Action executes correctly |

**Variants to test**:
- Appointments: Check-in (within 48h), Reschedule (>48h), Join Video (video apt), Book Again (past/cancelled)
- Billing: Pay Now (unpaid), Download Receipt (paid), View Status (disputed)

### TC-003: Menu Order & Destructive Styling

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click ⋮ button | Menu opens |
| 2 | Check order | Non-destructive actions first |
| 3 | Check destructive items | `text-red-600`, separator above |

**Destructive actions to verify**: Cancel Appointment, Delete Policy, Cancel Dispute, Raise Dispute

### TC-004: Destructive Confirmation

| Action | Expected Confirmation |
|--------|----------------------|
| Cancel Appointment | CancelSheet with reason selection |
| Delete Policy | `confirm()` dialog or confirmation modal |
| Cancel Dispute | `confirm()` dialog |
| Raise Dispute | Form sheet (not instant action) |

### TC-005: Check-in Window Logic (Appointments)

| Hours Until Appointment | Expected Primary |
|-------------------------|------------------|
| > 48h | Reschedule (or Join Video if video) |
| 24h – 48h | Check-in |
| 0h – 24h | Check-in |
| < 0h (past) | Book Again (detail page) |

**Test approach**: Create test appointments with different dates/times

### TC-006: Platform Health Sync Labels

| Platform | Expected Label in Menu |
|----------|------------------------|
| iOS (Safari/WebView) | Add to Apple Health |
| Android (Chrome) | Add to Google Fit |
| Desktop Web | Add to Health App |

**Detection method**: Check `navigator.userAgent` for platform

### TC-007: Conditional Menu Items

| Condition | Item Visible |
|-----------|--------------|
| Health record has `appointment_id` | View Appointment |
| Billing has `insurance_details` | Reimbursement Letter |
| Insurance claim status = rejected | Appeal |
| Billing dispute status = Under Review | Cancel Dispute |
| Health record category ∈ [lab_report, vitals, immunization] | Add to Health App |

---

## Navigation Flow Tests

### NF-001: Appointment Upcoming → Cancel → Back

```
/appointments
  → Click upcoming row
  → Sheet opens (DetailsSheet)
  → Click "Cancel" in menu
  → CancelSheet opens (nested)
  → Verify Back arrow (ChevronLeft) in header
  → Click Back
  → Returns to DetailsSheet (state preserved)
  → Close sheet
  → Row still shows in list
```

### NF-002: Appointment Past → Book Again

```
/appointments (Past tab)
  → Click row
  → Navigates to /appointments/{id}
  → Verify "Book Again" primary button
  → Click "Book Again"
  → BookAgainSheet opens
  → Select options, confirm
  → Redirects to /appointments or new booking
```

### NF-003: Insurance Policy → Pre-Auth Flow

```
/insurance
  → Click policy row
  → Navigates to /insurance/{id}
  → Verify "Use for Admission" primary button
  → Click button
  → Pre-Auth Sheet opens (multi-step)
  → Complete all steps
  → Toast: "Pre-authorization submitted"
  → Sheet closes
```

### NF-004: Billing Disputed → View Status

```
/billing
  → Click disputed row
  → Navigates to /billing/{id}
  → Verify "View Status" primary button
  → Click button
  → Page scrolls to #dispute section
  → Dispute details visible
```

### NF-005: Health Record → Amendment Request

```
/health-records
  → Click any record row
  → Navigates to /health-records/{id}
  → Click ⋮ menu
  → Click "Request Amendment"
  → Toast: "Amendment request submitted. You will be contacted within 48 hours."
```

---

## Consistency Checks

### Label Audit

| Action | Correct Label | Incorrect Labels |
|--------|---------------|------------------|
| Rebooking | Book Again | Rebook, Re-book, Book Similar |
| Status view | Check Status | View Status*, Track Status |
| Download file | Download | Export, Save, Get |
| Share | Share | Send, Forward |
| Add to calendar | Add to Calendar | Save to Calendar |
| Payment | Pay Now | Pay, Make Payment |

*Exception: Billing disputed uses "View Status" (scrolls to section, not external check)

### No Duplicate Actions

- [ ] Menu never contains "View Details" or "Open"
- [ ] Menu never contains "View" (row click already does this)
- [ ] Primary action NOT repeated in menu (unless conditional visibility)
- [ ] No "Close" in menu (sheet X button handles this)

### Icon Consistency

| Action | Icon |
|--------|------|
| Download | Download |
| Share | Share2 |
| Calendar | CalendarPlus |
| Directions | MapPin |
| Edit | Pencil |
| Delete | Trash2 |
| Menu trigger | MoreVertical |

---

## Error Scenarios

### E-001: Check-in Outside Window

| Scenario | Expected |
|----------|----------|
| Click Check-in when >48h away | Button should not appear (show Reschedule instead) |
| POST to /check-in when >48h | 400 error: "Check-in is only available within 48 hours" |

### E-002: Payment Failure

| Scenario | Expected |
|----------|----------|
| Razorpay modal closed | Toast: "Payment cancelled" |
| Payment declined | Toast with error message from gateway |
| Network error | Toast: "Unable to process payment. Please try again." |

### E-003: Delete/Cancel Confirmation Dismissed

| Scenario | Expected |
|----------|----------|
| Click Cancel, then dismiss confirmation | No action taken, return to detail view |
| Click Delete, then click "No" in confirm | Policy remains, no navigation |

### E-004: Share Sheet Errors

| Scenario | Expected |
|----------|----------|
| Copy link fails | Toast: "Failed to copy link" |
| WhatsApp not installed (mobile) | Opens WhatsApp web or shows error |
| Email client not configured | Opens mailto: link (browser handles) |

---

## Accessibility Checklist

### Keyboard Navigation

- [ ] All buttons focusable with Tab
- [ ] DropdownMenu opens with Enter/Space
- [ ] Menu items navigable with Arrow keys
- [ ] Menu closes with Escape
- [ ] Sheet closes with Escape
- [ ] Focus returns to trigger after sheet/menu close

### Screen Reader

- [ ] All buttons have accessible names (not just icons)
- [ ] DropdownMenuTrigger has `aria-label` or visible text
- [ ] Toast messages announced (`aria-live="polite"`)
- [ ] Sheet has proper role and label
- [ ] Status badges have text (not color-only)

### Visual

- [ ] Focus indicators visible on all interactive elements
- [ ] Destructive items have red text (not color-only — also has Trash icon or "Cancel" text)
- [ ] Sufficient color contrast (4.5:1 minimum)
- [ ] Touch targets minimum 44x44px on mobile

---

## Analytics Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `detail_view_opened` | Row click | `section`, `entity_id`, `open_type` (sheet/page) |
| `primary_action_clicked` | Primary button click | `section`, `action`, `status` |
| `menu_action_clicked` | Menu item click | `section`, `action` |
| `action_completed` | Successful action | `section`, `action`, `duration_ms` |
| `action_failed` | Error during action | `section`, `action`, `error_code` |
| `sheet_opened` | Any sheet open | `sheet_name`, `trigger` |
| `sheet_closed` | Any sheet close | `sheet_name`, `method` (x/escape/complete) |

---

## Missing Actions — Recommendations

| Section | Missing Action | Recommendation |
|---------|----------------|----------------|
| Appointments (Past) | Leave Review | Add rating/feedback prompt after "Book Again" |
| Appointments (Past) | Download Summary | Generate consultation summary PDF |
| Health Records | Print | Add browser print option (Ctrl+P) |
| Insurance Claims | Contact Insurer | Direct phone/email link to insurance provider |
| Billing (Paid) | Tax Receipt | Generate tax-deductible receipt format |
| Billing (All) | Download All | Bulk download for tax purposes |

---

## Test Data Requirements

| Section | Required States |
|---------|-----------------|
| **Appointments** | Upcoming (>48h), Upcoming (≤48h), Past (completed), Cancelled |
| **Health Records** | lab_report, vitals, immunization, prescription (with/without appointment_id) |
| **Insurance Policies** | Active, with different is_primary values |
| **Insurance Claims** | submitted, under_review, rejected, approved, paid |
| **Billing** | payable, overdue, emi, paid, covered, reimbursed, disputed |

---

## Sign-off Checklist

- [ ] All matrix combinations tested
- [ ] All navigation flows verified
- [ ] All error scenarios handled gracefully
- [ ] Accessibility audit passed
- [ ] Analytics events firing correctly
- [ ] No console errors during testing
- [ ] Mobile responsive behavior verified
- [ ] Cross-browser tested (Chrome, Safari, Firefox)

---

**Last Updated**: February 3, 2026
**Created By**: Claude Code
**Status**: Ready for QA execution
