// Inside PublicRegister.jsx
const { eventId } = useParams();
const [eventDetails, setEventDetails] = useState(null);

useEffect(() => {
  const getEvent = async () => {
    // 1. Fetch the specific event settings from your 'events' collection
    const docRef = doc(db, "events", eventId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setEventDetails(docSnap.data());
    } else {
      console.error("No such event!");
    }
  };
  getEvent();
}, [eventId]);

// 2. Pass those details into the Form
return (
  <RegistrationForm 
    eventName={eventDetails?.title} // This fixes the "Event Name" display
    formConfig={eventDetails?.formConfig} // This hides/shows fields
    selectedSession={sessionName}
  />
);