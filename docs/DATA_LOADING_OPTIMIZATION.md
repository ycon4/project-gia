# Data Loading Optimization

## Overview
This document describes the data loading optimization implemented to reduce unnecessary Firestore reads and improve application performance.

## Problem
Previously, `App.jsx` loaded ALL database collections (attendance, employee_information, events, student_enrollment) on application startup, regardless of which page the user was viewing. This caused:
- **Wasted Firestore reads**: Loading student_enrollment data even when viewing Events page
- **Slower initial load**: Loading 1000+ records unnecessarily
- **Quota concerns**: Excessive reads during development/testing

## Solution: Lazy Loading Per Page
Data is now loaded **only when needed** by each page:

### App.jsx (Global Level)
- **No longer loads any data collections**
- Only manages authentication, navigation, and UI state
- Events and attendance are loaded by EventsPage directly

### ChatPage.jsx
- **Loads its own data** when the page mounts
- Collections loaded: `attendance`, `employee_information`, `events`, `student_enrollment`
- Data is cached in local state and persists while ChatPage is active
- Includes refresh button to reload data on demand

### DistributionPage.jsx
- **Loads its own data** when the page mounts or when switching tabs
- Loads complete datasets (not paginated) for accurate visualizations
- Collections loaded: `student_enrollment`, `employee_information` (based on active tab)

### EventsPage.jsx
- **Loads its own data** when the page mounts
- Collections loaded: `events`, `attendance`
- Filters events based on user role (USER sees only their events, ADMIN/SUPER_ADMIN see all)
- Manages local state for events and updates it when creating/updating/deleting events
- Uses real-time listener (onSnapshot) for attendance data of the selected event

## Benefits
✅ **Reduced Firestore reads**: Only load data when actually needed
✅ **Faster navigation**: Switching to Events page doesn't load student_enrollment
✅ **Better performance**: Initial app load is faster
✅ **Quota savings**: Significant reduction in reads during development
✅ **Scalability**: Each page manages its own data lifecycle

## Implementation Details

### EventsPage Data Loading
```javascript
// EventsPage.jsx manages its own events and attendance state
const [events, setEvents] = useState([]);
const [attendance, setAttendance] = useState([]);
const [loadingEvents, setLoadingEvents] = useState(true);

// Load data on mount
useEffect(() => {
  const loadEventsData = async () => {
    setLoadingEvents(true);
    try {
      const [eventsData, attendanceData] = await Promise.all([
        getAllDocuments('events'),
        getAllDocuments('attendance'),
      ]);
      setEvents(eventsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading events data:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  loadEventsData();
}, []);

// Real-time listener for attendance of selected event
useEffect(() => {
  if (!activeEvent?.id) return;
  const q = query(collection(db, 'attendance'), where('eventId', '==', String(activeEvent.id)));
  const unsub = onSnapshot(q, (snap) => {
    setAttendanceData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
  return unsub;
}, [activeEvent?.id]);
```
```javascript
// ChatPage.jsx manages its own data state
const [dbData, setDbData] = useState({});
const [isLoadingData, setIsLoadingData] = useState(false);
const [dataLoaded, setDataLoaded] = useState(false);

// Load data on mount
useEffect(() => {
  if (!dataLoaded && !isLoadingData) {
    loadDatabaseData();
  }
}, []);

const loadDatabaseData = async () => {
  setIsLoadingData(true);
  try {
    const collections = ['attendance', 'employee_information', 'events', 'student_enrollment'];
    const results = await Promise.allSettled(collections.map(col => getAllDocuments(col)));
    // ... process results
    setDbData(data);
    setDataLoaded(true);
  } finally {
    setIsLoadingData(false);
  }
};
```

### Refresh Functionality
Each page can refresh its own data independently:
- **ChatPage**: Refresh button in the data status indicator
- **DistributionPage**: Automatically refreshes when switching tabs
- **EventsPage**: Reloads when events are created/updated/deleted

## Migration Notes
- Removed `dbData`, `isLoadingData`, `dataLoaded` props from App.jsx
- Removed `loadDatabaseData` function from App.jsx
- Removed `onRefreshData` prop from ChatPage
- ChatPage is now fully self-contained for data management

## Testing Recommendations
During development, use fewer test rows to minimize Firestore reads:
- Keep test datasets small (e.g., 50-100 records instead of 1000+)
- Use the refresh button sparingly
- Clear browser cache if data seems stale

## Future Improvements
- Implement data caching across pages (e.g., using Context or state management library)
- Add pagination for large datasets in ChatPage
- Implement incremental loading (load more data as needed)
- Add data invalidation strategy (refresh only when data changes)
