# 🎬 Multi-Platform Video Hosting File Rename Dashboard

A full-stack web application for managing and renaming video files across three video hosting platforms (RPMShare, StreamP2P, SeekStreaming) with a beautiful dark-themed UI, real-time statistics, and intelligent batch processing.

## 🌟 Features

- **Multi-Platform Support**: Integrates with RPMShare, StreamP2P, and SeekStreaming
- **SKYFLIX Filter**: Automatically excludes files containing "SKYFLIX" in filename
- **Batch Processing**: Processes 20 files at a time with 2-second delays
- **API Key Rotation**: Alternates between API keys to avoid rate limiting
- **Real-Time Statistics**: 
  - Today's rename count (resets at midnight)
  - Rolling 24-hour statistics
  - Success rate tracking
- **Activity Log**: Real-time activity feed with color-coded status
- **Beautiful Dark Theme**: Modern glass-morphism UI with smooth animations
- **Smart File Matching**: Shows unique filenames even if they exist on multiple platforms

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- API keys for all three platforms

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd "c:\Users\mohds\OneDrive\Pictures\Dasboard Rename"
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**:
   
   The `.env` file is already configured in `backend/.env` with your API keys.

### Running the Application

1. **Start the backend server** (from `backend` directory):
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

   Backend will run on `http://localhost:5000`

2. **Start the frontend application** (from `frontend` directory):
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000` and automatically open in your browser.

## 📁 Project Structure

```
Dasboard Rename/
├── backend/
│   ├── api/
│   │   ├── RPMShareAPI.js
│   │   ├── StreamP2PAPI.js
│   │   └── SeekStreamingAPI.js
│   ├── database/
│   │   └── db.js
│   ├── routes/
│   │   └── api.js
│   ├── services/
│   │   ├── fileService.js
│   │   ├── renameService.js
│   │   └── statsService.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Button.jsx
    │   │   │   └── LoadingSpinner.jsx
    │   │   ├── Dashboard/
    │   │   │   ├── ActivityLog.jsx
    │   │   │   ├── Dashboard.jsx
    │   │   │   └── StatsCards.jsx
    │   │   ├── RenameSection/
    │   │   │   ├── LeftBox.jsx
    │   │   │   ├── RenameSection.jsx
    │   │   │   └── RightBox.jsx
    │   │   └── Header.jsx
    │   ├── context/
    │   │   └── AppContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── styles/
    │   │   └── darkTheme.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

## 🎯 How to Use

### 1. Fetch Files
- Click the **"Fetch All Files"** button in the left column
- Files from all three platforms will be fetched and displayed
- Files containing "SKYFLIX" are automatically filtered out
- Duplicate filenames are shown only once with platform badges

### 2. Rename Files
- Original filenames appear in the **left column**
- Enter new filenames in the **right column** inputs
- Use **"Paste"** button to paste multiple filenames from clipboard
- Use **"Reset"** button to restore original filenames
- Click **"Go Rename"** to start the batch process

### 3. Monitor Progress
- Progress bar shows current rename status
- Dashboard displays real-time statistics
- Activity log shows detailed rename history

## 🔑 API Keys

The following API keys are pre-configured in `backend/.env`:

**RPMShare:**
- Key 1: `9296838b93982058f014e66f`
- Key 2: `fff2a1fd688b0b315bff26bd`

**StreamP2P:**
- Key 1: `e7217c652a08c52db27f079c`
- Key 2: `68f0a04a15ecbb5ff2e7c7b6`

**SeekStreaming:**
- Key 1: `c56c50a698b4ba9cc6792868`
- Key 2: `7e33797d15fe8f99c11b5a91`

## ⚙️ Configuration

### Backend
- **Port**: 5000 (configurable in `.env`)
- **Database**: SQLite (`backend/database/video_rename.db`)
- **Cleanup Job**: Runs daily at 2:00 AM to remove old records

### Frontend
- **Port**: 3000 (configurable in `vite.config.js`)
- **API Proxy**: Automatically proxies `/api` requests to backend

## 🎨 Color Palette

- **Primary Background**: `#0f0f23`
- **Secondary Background**: `#1a1a2e`
- **Accent Purple**: `#6C63FF`
- **Accent Green**: `#00D9A3`
- **Error Red**: `#FF6B6B`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#B8B8D0`

## 📊 Features in Detail

### SKYFLIX Filter
All files containing "SKYFLIX" (case-insensitive) in their filename are automatically excluded from fetch results. This is implemented in the backend `fileService.js`.

### Batch Processing
- Processes files in batches of 20
- 2-second delay between batches to avoid rate limiting
- Alternates between API key sets for each batch
- Real-time progress tracking

### Statistics
- **Today's Renames**: Count resets at midnight (00:00)
- **Last 24 Hours**: Rolling 24-hour window
- **Success Rate**: Calculated from successful vs total renames
- **Auto-refresh**: Stats update every 30 seconds

## 🛠️ Technology Stack

**Backend:**
- Node.js + Express.js
- better-sqlite3 (database)
- axios (HTTP client)
- node-cron (scheduled tasks)

**Frontend:**
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- axios (API calls)
- react-toastify (notifications)
- Lucide React (icons)

## 🐛 Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Verify all dependencies are installed: `npm install`
- Check `.env` file exists in backend directory

### Frontend won't start
- Check if port 3000 is available
- Verify all dependencies are installed: `npm install`
- Clear node_modules and reinstall if needed

### API errors
- Verify API keys are correct in `.env`
- Check network connectivity
- Review backend console logs for detailed error messages

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🙏 Support

For issues or questions, check the console logs in both frontend (browser DevTools) and backend (terminal) for detailed error messages.
