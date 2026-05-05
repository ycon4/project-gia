# Event Queries - What the System ACTUALLY Returns

## Date: 2026-05-04

This document shows **exactly what data** the chat system returns for different event queries, based on code analysis.

---

## 🔍 How Event Detection Works

The system detects event queries when the message contains:
- `event`, `seminar`, `workshop`, `training`, or `symposium`

Then it sets: `intent.collection = 'events'`

---

## 📊 What Data Gets Returned

### Case 1: Event Query WITH Attendance/Gender Keywords

**Triggers when query contains:**
- `male`, `female`, `sex`, `gender`, `distribution`, `breakdown`, `attended`, `attendance`

**What happens:**
1. Groups events by `eventType` (or event `title` if no eventType)
2. For each group, finds ALL attendance records via `eventId`
3. Calculates sex breakdown (Male/Female counts + percentages)
4. Returns aggregated data

**Example Query:** "How many people attended the Anti-sexual harassment seminar?"

**Actual Response Structure:**
```javascript
{
  collection: "Events",
  academicYear: "All Years",
  isComparison: false,
  groupField: "eventType",  // or "title"
  filterValue: null,
  sexField: "sex",
  totalRecords: 5,  // Number of EVENTS (not attendees!)
  data: {
    "Anti-sexual harassment seminar": {
      Total: 770,  // Sum of ALL attendance records for ALL events with this title
      Male: 292,
      "Male %": "37.9%",
      Female: 478,
      "Female %": "62.1%"
    }
  }
}
```

**⚠️ PROBLEM:** If multiple events have the same or similar titles, it aggregates ALL their attendance!

---

### Case 2: Event Query WITHOUT Attendance Keywords

**Triggers when query contains:**
- Event keywords BUT NOT attendance/gender keywords
- Example: "How many events?", "List all seminars"

**What happens:**
1. Normalizes event data (fills in defaults for missing fields)
2. Groups by the detected field (eventType, mode, venue, etc.)
3. Returns simple counts

**Example Query:** "How many training events?"

**Actual Response Structure:**
```javascript
{
  collection: "Events",
  academicYear: "All Years",
  totalRecords: 15,  // Total number of events
  data: {
    "Training": 8,
    "Seminar": 5,
    "Workshop": 2
  }
}
```

**Note:** This does NOT include attendance data, just event counts.

---

## 📋 Supported Query Types & Their Responses

### 1. **Count Events by Type**

**Query:** "How many seminars?"  
**Returns:**
```javascript
{
  totalRecords: 15,
  data: {
    "Seminar": 5,
    "Training": 8,
    "Workshop": 2
  }
}
```

---

### 2. **Count Events by Mode**

**Query:** "How many online events?"  
**Returns:**
```javascript
{
  totalRecords: 15,
  data: {
    "Online": 6,
    "In-person": 7,
    "Hybrid": 2
  }
}
```

---

### 3. **Count Events by Venue**

**Query:** "Events by venue"  
**Returns:**
```javascript
{
  totalRecords: 15,
  data: {
    "MSU-IIT Auditorium": 5,
    "Zoom": 6,
    "Conference Room A": 4
  }
}
```

---

### 4. **Count Events by Organizer**

**Query:** "Events by organizer"  
**Returns:**
```javascript
{
  totalRecords: 15,
  data: {
    "GADC": 8,
    "College of Engineering": 4,
    "Student Affairs": 3
  }
}
```

---

### 5. **Count Events by Status**

**Query:** "How many active events?"  
**Returns:**
```javascript
{
  totalRecords: 15,
  data: {
    "Active": 3,
    "Done": 10,
    "Cancelled": 2
  }
}
```

---

### 6. **Event Attendance with Gender Breakdown** ⚠️

**Query:** "How many people attended the Anti-sexual harassment seminar?"  
**Returns:**
```javascript
{
  totalRecords: 5,  // Number of events (NOT attendees!)
  data: {
    "Anti-sexual harassment seminar": {
      Total: 770,  // ⚠️ AGGREGATED across all matching events
      Male: 292,
      "Male %": "37.9%",
      Female: 478,
      "Female %": "62.1%"
    }
  }
}
```

**⚠️ ISSUE:** Groups by event title/type, so if there are multiple events with the same name, it sums ALL their attendance!

---

### 7. **Event Attendance by Event Type**

**Query:** "Gender breakdown for training events"  
**Returns:**
```javascript
{
  totalRecords: 8,  // Number of training events
  data: {
    "Training": {
      Total: 450,  // Total attendance across ALL training events
      Male: 180,
      "Male %": "40.0%",
      Female: 270,
      "Female %": "60.0%"
    }
  }
}
```

---

## ❌ What the System CANNOT Return

### 1. **Specific Event Details**
❌ Cannot return: Event date, description, objectives, budget for a specific event
❌ Only returns: Aggregated counts and attendance

### 2. **Session-Specific Data**
❌ Cannot filter by: "Day 1", "Pre-Registration", "Morning Session"
❌ Returns: Total attendance across ALL sessions

### 3. **Sector Breakdown**
❌ Cannot return: Student/Faculty/Staff breakdown for events
❌ Only returns: Male/Female breakdown

**Why?** The code only calculates `sexCounts`, not `sectorCounts`:
```javascript
const sexCounts = {};
attendees.forEach(a => {
  const sex = a.sex || 'Unknown';
  sexCounts[sex] = (sexCounts[sex] || 0) + 1;
});
// No sectorCounts calculation!
```

### 4. **College/Department Distribution**
❌ Cannot return: Which colleges had most participants
❌ Not calculated in the events logic

### 5. **Target vs Actual Comparison**
❌ Cannot return: "Did we meet our target?"
❌ `targetParticipants` field exists but not compared with actual attendance

### 6. **Date Range Filtering**
❌ Cannot filter: "Events in May 2026"
❌ No date parsing logic for events

### 7. **Budget/Funding Analysis**
❌ Cannot return: "Total budget", "Average budget per event"
❌ Only returns: Event counts, not aggregated numbers

### 8. **Multi-Field Filtering**
❌ Cannot filter: "Female students in online training events"
❌ Events logic doesn't support `andFilters`

---

## 🎯 Summary: What You CAN Ask

### ✅ **Simple Counts** (Works)
- "How many events?"
- "How many seminars?"
- "Count of training events"

### ✅ **Grouping by Event Fields** (Works)
- "Events by type"
- "Events by mode"
- "Events by venue"
- "Events by organizer"
- "Events by status"

### ⚠️ **Attendance with Gender** (Works but Inaccurate)
- "How many attended [event name]?" - Returns aggregated count
- "Gender breakdown for events" - Groups by event type
- "Male vs female in seminars" - Aggregates all seminars

### ❌ **Everything Else** (Doesn't Work)
- Specific event details
- Session breakdowns
- Sector distribution
- College distribution
- Target vs actual
- Date filtering
- Budget analysis
- Multi-field filters

---

## 💡 What Users Should Do Instead

For detailed event analytics, users should:

1. **Use Chat For:**
   - Quick event counts
   - General statistics
   - Event type distribution

2. **Visit Events Page For:**
   - Specific event attendance (accurate count)
   - Session-by-session breakdown
   - Sector distribution charts
   - College participation
   - Gender breakdown by session
   - PWD and inclusion metrics
   - All detailed analytics

---

## 🔧 What Needs to be Fixed

### Priority 1: Accurate Event Attendance
- Filter to specific event by `eventId`
- Don't aggregate across multiple events with same name

### Priority 2: Add Sector Breakdown
- Calculate `sectorCounts` like `sexCounts`
- Return Student/Faculty/Staff/Other distribution

### Priority 3: Add Event Details
- Return event info (date, venue, organizer) with attendance

### Priority 4: Session Support
- Allow filtering by session name
- Return session-specific counts

---

**Last Updated:** May 4, 2026  
**Status:** Documented actual system behavior through code analysis
