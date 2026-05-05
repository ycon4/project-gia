# GIA - Gender and Development Center Information Assistant

GIA is an AI-powered data analytics platform for MSU-IIT GADC that provides intelligent insights into student enrollment, engagement, employee information, attendance, and events data.

## 🚀 Features

- **Student Enrollment Analytics**: Comprehensive visualizations with 11 charts covering demographics, socioeconomic distribution, disability types, and indigenous communities
- **AI-Powered Chat**: Natural language queries with intelligent data analysis using Groq's LLaMA 3.3 70B model
- **Event Management**: QR-based attendance tracking, poster generation, and analytics
- **Data Upload**: Excel-based data import with strict validation
- **Period Management**: Semester-based tracking for Student Enrollment (2024-2025 1st Semester format)

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account (for database)
- Groq API key (for AI chat functionality)

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd project-gia
```

### 2. Install dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the `project-gia` directory:

```env
# GIA Backend Configuration
# Get your API key from: https://console.groq.com/keys

GROQ_API_KEY=your_groq_api_key_here
PORT=3001
```

**To get your Groq API key:**
1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up or log in
3. Create a new API key
4. Copy and paste it into the `.env` file

### 4. Configure Firebase

Update `firebase/config.js` with your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## 🏃 Running the Application

You need to run **both** the frontend and backend servers:

### Terminal 1 - Backend Server
```bash
cd backend
npm start
```

The backend will start on `http://localhost:3001`

### Terminal 2 - Frontend Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## 💬 Chat Functionality

The chat feature supports various types of queries:

### Basic Queries
- "How many students are enrolled?"
- "Show me enrollment by college"
- "What is the total enrollment in COE?"

### Gender Breakdown
- "Show male and female distribution in CSM"
- "Gender breakdown by college"

### Vulnerability Indicators
- "How many PWD students are there?"
- "Students with solo parents in CEBA"
- "First generation learners by college"
- "Indigenous students in CCS"

### Comparisons
- "Compare enrollment between COE and CCS"
- "Year-over-year enrollment trends"
- "2023-2024 vs 2024-2025 enrollment"

### Multi-Condition Queries
- "PWD students in CEBA with solo parent households"
- "Working students who are first generation learners"

## 📊 Data Management

### Student Enrollment Upload

**Required Columns (18):**
- `studid`, `studgender`, `preferred_pronouns`, `studlegstatus`
- `studreligion`, `studethnic`, `currentadd_country`
- `is_child_solo_parent`, `is_indigenous`, `indigenous_group`
- `is_child_pdl`, `is_child_lgbtq`, `is_first_gen_learner`
- `is_pwd`, `pwd_aspect`, `stud_program`, `stud_college`, `stud_yrlevel`

**Period Format:**
- Semester-based: "2024-2025 1st Semester" or "2024-2025 2nd Semester"
- Only 1st and 2nd Semester (no Summer option)

### Features
- **Duplicate Detection**: Automatically detects existing student IDs
- **Append/Replace Modes**: Choose to add new records or replace existing data
- **Validation**: Strict column validation before upload
- **Modify Period**: Bulk update academic periods with dropdown suggestions
- **Delete Period**: Remove entire datasets with type-to-confirm protection

## 🎨 Design System

### Color Scheme (Gender-Neutral)
- **Male**: `#14b8a6` (Teal)
- **Female**: `#f59e0b` (Amber)
- **Primary (GIA)**: Purple gradient

### Charts
- 11 comprehensive charts in Student Enrollment
- Dynamic charts in chat with matching color scheme
- Responsive design with empty state handling

## 🔒 Security & Privacy

- No individual record editing (data integrity from MSU-IIT database)
- No export functionality (prevents unauthorized data extraction)
- Type-to-confirm deletion (must type "DELETE")
- Firebase authentication required

## 🛠️ Troubleshooting

### Chat not working?

1. **Check if backend is running:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","message":"GIA backend is running!"}`

2. **Verify GROQ_API_KEY is set:**
   - Check `.env` file in `project-gia` directory
   - Ensure the key is valid (test at [https://console.groq.com](https://console.groq.com))

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for error messages in Console tab
   - Common errors:
     - `Failed to fetch` → Backend not running
     - `401 Unauthorized` → Invalid API key
     - `429 Too Many Requests` → Rate limit exceeded

4. **Restart both servers:**
   - Stop both frontend and backend (Ctrl+C)
   - Start backend first, then frontend

### Port already in use?

If port 3001 is already in use, change it in `.env`:
```env
PORT=3002
```

Then update `src/services/aiService.js`:
```javascript
const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3002/api/chat'  // Update port here
  : '/api/chat';
```

## 📦 Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## 🤝 Contributing

This project is maintained by MSU-IIT GADC. For questions or issues, contact the development team.

## 📄 License

Proprietary - MSU-IIT Gender and Development Center

---

**Note**: This system handles sensitive student data. Ensure all security protocols are followed and access is restricted to authorized personnel only.
