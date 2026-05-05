# Event Chat Queries - Complete Reference Guide

## Date: 2026-05-04

This document lists **ALL possible event-related queries** that the GIA chat system currently supports.

---

## 🎯 Query Detection

The system detects event queries when the message contains these keywords:
- `event`
- `seminar`
- `workshop`
- `training`
- `symposium`

---

## 📋 Supported Event Fields

### 1. **Event Type** (`eventType`)
**Aliases:** `event type`, `type`

**Example Queries:**
- "Show me all training events"
- "How many seminars did we organize?"
- "List events by type"
- "What types of events do we have?"
- "Show me workshop events"

**Possible Values:**
- Training
- Seminar
- Symposium
- Capability Building
- Forum
- Orientation
- Workshop
- Other

---

### 2. **Event Mode** (`mode`)
**Aliases:** `event mode`, `mode`

**Example Queries:**
- "How many online events?"
- "Show me in-person events"
- "List hybrid events"
- "What events are online?"
- "Compare online vs in-person events"

**Possible Values:**
- In-person
- Online
- Hybrid

---

### 3. **Venue/Location** (`venue`)
**Aliases:** `venue`, `location`, `place`

**Example Queries:**
- "Events at MSU-IIT Auditorium"
- "Show me events by venue"
- "Where was the seminar held?"
- "List events by location"

---

### 4. **Organizer** (`organizer`)
**Aliases:** `organizer`, `organized by`

**Example Queries:**
- "Events organized by GADC"
- "Show me events by organizer"
- "Who organized the training?"
- "List events organized by [name]"

---

### 5. **Event Status** (`status`)
**Aliases:** `event status`, `status`

**Example Queries:**
- "Show me active events"
- "List completed events"
- "How many cancelled events?"
- "What events are done?"

**Possible Values:**
- Active
- Done
- Cancelled

---

### 6. **Target Group** (`targetGroup`)
**Aliases:** `target group`, `target`

**Example Queries:**
- "Events for students"
- "Show me faculty events"
- "What's the target group for this event?"

---

### 7. **Target Participants** (`targetParticipants`)
**Aliases:** `participants`, `target participants`

**Example Queries:**
- "What's the target attendance?"
- "How many participants were targeted?"
- "Show me events with target over 100"

---

### 8. **Budget** (`budget`)
**Aliases:** `budget`

**Example Queries:**
- "What's the budget for events?"
- "Show me events by budget"
- "How much was allocated?"
- "Total event budget"

---

### 9. **Funding Source** (`fundingSource`)
**Aliases:** `funding`, `funding source`

**Example Queries:**
- "What's the funding source?"
- "Show me events by funding"
- "Who funded the seminar?"

---

### 10. **Partner Agencies** (`partnerAgencies`)
**Aliases:** `partner agencies`, `partners`

**Example Queries:**
- "What partner agencies were involved?"
- "Show me events with partners"
- "List partner agencies"

---

### 11. **GAD Mandate** (`gadMandate`)
**Aliases:** `gad mandate`, `mandate`

**Example Queries:**
- "Events under RA 9710"
- "Show me GAD mandate compliance"
- "What's the GAD mandate for this event?"

---

## 👥 Attendance-Related Queries

When asking about event **attendance**, the system pulls data from the `attendance` collection:

### Supported Attendance Fields:

#### **Sector** (`sector`)
**Example Queries:**
- "How many students attended?"
- "Show me faculty participation"
- "Sector breakdown for the event"
- "Staff attendance"

**Possible Values:**
- Student
- Faculty
- Staff
- Other Beneficiaries

#### **Office/College** (`office_college`)
**Example Queries:**
- "Which college had the most participants?"
- "Show me attendance by college"
- "COE participation in events"

#### **Sex/Gender** (SDD)
**Example Queries:**
- "Gender breakdown for the event"
- "How many male vs female attended?"
- "Show me sex-disaggregated data"
- "Male and female participants"

---

## 🔍 Query Patterns That Work

### 1. **Counting Queries**
✅ "How many events?"
✅ "How many people attended [event name]?"
✅ "Total number of events"
✅ "Count of seminars"

### 2. **Breakdown/Analysis Queries**
✅ "Show me event breakdown by type"
✅ "Gender breakdown for events"
✅ "Sector distribution"
✅ "Analyze event attendance"

### 3. **Filtering Queries**
✅ "Show me online events"
✅ "List active events"
✅ "Events in 2026"
✅ "Training events only"

### 4. **Comparison Queries**
✅ "Compare online vs in-person events"
✅ "Compare attendance across events"
✅ "Difference between seminars and workshops"

### 5. **Specific Event Queries** (⚠️ Currently has accuracy issues)
⚠️ "How many attended the Anti-sexual harassment seminar?"
⚠️ "Show me data for [specific event name]"
⚠️ "Attendance for the training event"

**Note:** Specific event queries currently group by event type/title and may return aggregated data across multiple events with similar names. **This needs to be fixed.**

---

## ❌ What DOESN'T Work (Current Limitations)

### 1. **Specific Event Title Matching**
❌ System doesn't accurately filter to ONE specific event
❌ Returns aggregated data for all events with similar type/title
❌ Example: "Anti-sexual harassment seminar" returns 770 instead of 52

### 2. **Session-Specific Queries**
❌ "How many attended Day 1?"
❌ "Pre-registration count for [event]"
❌ "Morning session attendance"

**Workaround:** Users must visit the Events page for session-specific data

### 3. **Date Range Queries**
❌ "Events between May 1-15"
❌ "Show me events this week"
❌ "Events in Q1 2026"

### 4. **Complex Multi-Field Filters**
❌ "Female students from COE who attended training events"
❌ "PWD participants in online seminars"
❌ "Faculty from CASS in active events"

### 5. **Aggregations Across Events**
❌ "Average attendance per event"
❌ "Total budget across all events"
❌ "Participation rate by event type"

---

## 🎯 Default Behavior

### When No Specific Field is Mentioned:
- **Groups by:** `eventType` (Training, Seminar, Workshop, etc.)
- **Shows:** Count of events per type
- **Includes:** Sex breakdown if requested

### When "Attendance" is Mentioned:
- **Switches to:** `attendance` collection
- **Links:** Attendance records to events via `eventId`
- **Shows:** Participant counts and demographics

---

## 📊 What Gets Returned

### For General Event Queries:
```javascript
{
  totalRecords: 5,  // Number of events
  data: {
    "Training": { Total: 2, Male: 45, Female: 67, "Male %": "40.2%", "Female %": "59.8%" },
    "Seminar": { Total: 3, Male: 120, Female: 180, "Male %": "40.0%", "Female %": "60.0%" }
  }
}
```

### For Specific Event Queries (⚠️ Currently Inaccurate):
```javascript
{
  totalRecords: 770,  // ❌ WRONG - Aggregates multiple events
  data: {
    "Anti-sexual harassment seminar": { 
      Total: 770,  // ❌ Should be 52
      Male: 292, 
      Female: 478,
      "Male %": "37.9%",
      "Female %": "62.1%"
    }
  }
}
```

**Should Return:**
```javascript
{
  totalRecords: 52,  // ✅ Correct count for THIS specific event
  data: {
    "Anti-sexual harassment seminar": { 
      Total: 52,
      Male: 20,
      Female: 32,
      "Male %": "38.5%",
      "Female %": "61.5%"
    }
  },
  sectorBreakdown: {
    "Student": 30,
    "Faculty": 15,
    "Staff": 5,
    "Other Beneficiaries": 2
  },
  eventInfo: {
    title: "Anti-sexual harassment seminar",
    type: "Seminar",
    date: "2026-05-02",
    venue: "MSU-IIT Auditorium",
    mode: "In-person"
  }
}
```

---

## 🔧 Recommended Fixes

### Priority 1: Fix Specific Event Queries
- Add event title detection and exact matching
- Filter attendance by specific `eventId`
- Return accurate counts for individual events

### Priority 2: Add Session Support
- Allow queries like "Day 1 attendance"
- Support session-specific breakdowns

### Priority 3: Enhance Date Filtering
- Support date range queries
- Add "this month", "this quarter" shortcuts

### Priority 4: Multi-Field Filtering
- Allow combining event fields with attendance demographics
- Example: "Female participants in online training events"

---

## 📝 Summary

### ✅ Currently Works Well:
- Event type grouping and counting
- Mode/venue/organizer filtering
- Sex-disaggregated data (SDD)
- Sector breakdown
- General event statistics

### ⚠️ Needs Improvement:
- **Specific event queries** (accuracy issue)
- Session-specific data
- Date range filtering
- Complex multi-field queries

### 💡 Best Practice:
For detailed event analytics, users should:
1. Use chat for **quick summaries** and **general statistics**
2. Visit **Events page** for **specific event details**, session breakdowns, and comprehensive analytics

---

**Last Updated:** May 4, 2026  
**Status:** Documented current capabilities and limitations
