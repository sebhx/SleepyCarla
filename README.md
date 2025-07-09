# 🌙 SleepyCarla - Baby Sleep Tracker PWA

A modern, beautiful Progressive Web App for tracking baby sleep patterns, designed specifically for babies aged 6-12 months.

## ✨ Features

### Core Tracking

- **Real-time Sleep Logging**: Easy-to-use interface for logging sleep and wake times
- **Nap Tracking**: Track up to 3 naps per day with automatic numbering
- **Live Duration Tracking**: Real-time sleep duration display while baby sleeps
- **Manual Entry**: Add past sleep entries with flexible time input options
- **Edit & Delete**: Full CRUD operations for sleep entries

### Smart Recommendations

- **Wake Window Calculations**: Age-appropriate wake windows (2.5-4 hours)
- **Intelligent Nap Suggestions**: Recommends optimal nap timing based on baby's age and last wake time
- **Confidence Indicators**: Shows recommendation confidence (high/medium/low)

### Analytics & Insights

- **Sleep Analytics Dashboard**: Visual insights into sleep patterns
- **Weekly Pattern Visualization**: Bar charts showing nap and night sleep duration
- **Average Statistics**: Weekly averages for naps, sleep duration, and totals
- **Historical Data**: Track patterns over time

### Technical Features

- **PWA Support**: Install as an app, works offline
- **Persistent Storage**: SQLite database for reliable data storage
- **Real-time Sync**: Automatic data synchronization between frontend and backend
- **Mobile-First Design**: Optimized for iPhone and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Baby-Themed UI**: Soft colors and playful design perfect for parents

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd SleepyCarla
```

2. Install dependencies:

```bash
npm install
```

3. Start both servers (recommended for development):

```bash
npm run dev:full
```

Or start them separately:

```bash
# Terminal 1 - Backend server
npm run server:dev

# Terminal 2 - Frontend server
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Production Build

```bash
# Build the frontend
npm run build

# Start the production server
npm run start
```

## 🏗️ Architecture

### Frontend (Vue 3 + TypeScript)

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Styling**: CSS custom properties with mobile-first approach
- **PWA**: Service worker with offline capabilities
- **State Management**: Vue reactivity with composables

### Backend (Node.js + Express)

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 4.x
- **Database**: SQLite3 with custom query helpers
- **API**: RESTful API with CORS support
- **Development**: Nodemon for auto-restart

## 📱 Usage

1. **Starting Sleep**:
   - Tap "Start Nap X" to begin a nap (automatically numbered)
   - Tap "Start Night Sleep" for bedtime
2. **Ending Sleep**:

   - Tap "Baby Woke Up" when baby wakes up
   - Duration is automatically calculated and logged

3. **View History**:
   - Recent sleep/wake events are displayed in the activity section
   - Shows time and duration for each entry

## 🛠 Tech Stack

- **Frontend**: Vue.js 3 with TypeScript
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa
- **Styling**: Modern CSS with CSS Variables
- **State Management**: Vue Composition API

## 📋 Sleep Schedule Settings

Currently configured for:

- **Bedtime**: 19:00 (7 PM)
- **Wake time**: 07:00 (7 AM)
- **Number of naps**: 3 per day
- **Age range**: 6-12 months

## 🔧 Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run type-check
```

## 🎯 Roadmap

### Phase 1 ✅ (Current)

- [x] Basic sleep logging interface
- [x] PWA setup and configuration
- [x] Mobile-responsive design
- [x] Real-time sleep duration tracking

### Phase 2 (Next)

- [ ] SQLite database integration
- [ ] Wake window calculations
- [ ] Nap recommendations
- [ ] Data persistence

### Phase 3 (Future)

- [ ] Sleep pattern visualization
- [ ] Historical data analysis
- [ ] Export functionality
- [ ] Multiple baby profiles

## 🤝 Contributing

This is a personal project for home use, but suggestions and improvements are welcome!

## 📄 License

Private use only - not for commercial distribution.
