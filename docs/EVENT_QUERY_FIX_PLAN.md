# Event Query Accuracy Fix - Implementation Plan

## Date: 2026-05-04

## Problem Statement

When users ask "How many people attended the Anti-sexual harassment seminar?", the system returns **770** but the actual attendance shown in the dashboard is **52** (16 Pre-Registration + 36 Morning Session).

### Root Cause
The system is:
1. **Not filtering by specific event** - It groups by `eventType` which may include multiple events with similar types
2. **Summing all attendance** across all events that match the group, not just the specific event requested

## Solution: Standard Event Query Response

When a user asks about a **specific event**, automatically provide:

### 📋 Response Format (Concise Summary)

1. **Total Attendance** - Direct answer to the question
2. **SDD (Sex-Disaggregated Data)** - Male/Female breakdown with percentages
3. **Sector Breakdown** - Student/Faculty/Staff/Other Beneficiaries with percentages  
4. **Brief Event Info** - Type, Date, Venue/Mode

### Implementation Steps

#### Step 1: Detect Specific Event Queries

Add event title extraction in `parseQuery()`:

```javascript
// In parseQuery function, after events collection detection:
if (/\bevent|\bseminar|\bworkshop|\btraining|\bsymposium/i.test(lower)) {
  intent.collection = 'events';
  
  // Extract specific event title from query
  const eventTitleMatch = lower
    .replace(/how many (people|participants|attendees)?\s*(attended|registered|joined)?(\s+the)?/gi, '')
    .replace(/what('s| is) the (attendance|turnout) (for|of|in)(\s+the)?/gi, '')
    .replace(/show me (the )?(attendance|participants) (for|of|in)(\s+the)?/gi, '')
    .replace(/\?/g, '')
    .trim();
  
  if (eventTitleMatch && eventTitleMatch.length > 3) {
    intent.eventTitle = eventTitleMatch;
    intent.wantsSexBreakdown = true; // Always show SDD for specific events
  }
}
```

#### Step 2: Handle Specific Event Queries in `computeAnswer()`

Add special handling before the general events logic:

```javascript
if (collection === 'events' && intent.eventTitle) {
  // Find the specific event by fuzzy matching
  const searchTitle = simplifyStr(intent.eventTitle);
  const matchedEvent = allEvents.find(e => 
    simplifyStr(e.title || '').includes(searchTitle) ||
    searchTitle.includes(simplifyStr(e.title || ''))
  );

  if (matchedEvent) {
    // Get attendance ONLY for this specific event
    const eventAttendees = attendance.filter(a => 
      String(a.eventId) === String(matchedEvent.id)
    );
    
    // Calculate SDD
    const sexCounts = {};
    eventAttendees.forEach(a => {
      const sex = a.sex || a.gender || 'Unknown';
      sexCounts[sex] = (sexCounts[sex] || 0) + 1;
    });

    // Calculate sector breakdown
    const sectorCounts = {};
    eventAttendees.forEach(a => {
      const sector = a.sector || 'Unknown';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    const total = eventAttendees.length;
    
    // Build response with SDD percentages
    const sddData = {};
    Object.entries(sexCounts).forEach(([sex, count]) => {
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
      sddData[sex] = count;
      sddData[`${sex} %`] = `${pct}%`;
    });

    // Build sector data with percentages
    const sectorData = {};
    Object.entries(sectorCounts).forEach(([sector, count]) => {
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
      sectorData[sector] = count;
      sectorData[`${sector} %`] = `${pct}%`;
    });

    return {
      totalRecords: total,
      data: {
        [matchedEvent.title]: { Total: total, ...sddData }
      },
      sectorBreakdown: sectorData,
      eventInfo: {
        title: matchedEvent.title,
        type: matchedEvent.eventType,
        date: matchedEvent.startDate,
        venue: matchedEvent.venue,
        mode: matchedEvent.mode,
        organizer: matchedEvent.organizer,
        status: matchedEvent.status,
      }
    };
  } else {
    return {
      totalRecords: 0,
      data: {},
      error: `Event "${intent.eventTitle}" not found. Please check the event name.`
    };
  }
}
```

#### Step 3: Update Backend Prompt

Update `backend/prompt.txt` to format the response properly:

```
When responding to event-specific queries:
1. Start with the total attendance number
2. Show SDD table (Male/Female breakdown)
3. Show Sector breakdown table
4. Include brief event info (Type, Date, Venue)
5. Keep it concise - users can visit the Events page for detailed analytics

Example format:
"The Anti-sexual harassment seminar had 52 attendees.

**Sex-Disaggregated Data:**
- Male: 20 (38.5%)
- Female: 32 (61.5%)

**Sector Breakdown:**
- Student: 30 (57.7%)
- Faculty: 15 (28.8%)
- Staff: 5 (9.6%)
- Other Beneficiaries: 2 (3.8%)

**Event Info:**
- Type: Seminar
- Date: May 2, 2026
- Venue: MSU-IIT Auditorium
- Mode: In-person"
```

## Testing Checklist

- [ ] Query: "How many people attended the Anti-sexual harassment seminar?"
  - Should return: 52 (not 770)
  - Should show: SDD, Sector breakdown, Event info

- [ ] Query: "Show me attendance for the training event"
  - Should match specific training event
  - Should return accurate count

- [ ] Query: "What's the gender breakdown for the symposium?"
  - Should find specific symposium
  - Should show SDD

- [ ] Query: "How many events did we organize?" (general query)
  - Should still work with existing logic
  - Should group by eventType

## Benefits

✅ **Accurate counts** - Filters to specific event, not event type
✅ **Comprehensive summary** - SDD + Sector + Event info in one response
✅ **GAD-compliant** - Always includes sex-disaggregated data
✅ **Concise** - Users can visit Events page for detailed analytics
✅ **Fuzzy matching** - Handles variations in event name spelling

## Files to Modify

1. `src/services/aiService.js` - Add event title detection and specific event handling
2. `backend/prompt.txt` - Update response formatting instructions

## Estimated Effort

⏱️ **30-45 minutes** - Moderate complexity due to existing code structure

