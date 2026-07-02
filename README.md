# Focus Flow - Pomodoro Timer & Productivity Tracker

## About This Project
Focus Flow is a modern, beautifully designed Pomodoro timer application that helps you stay focused and manage your time effectively. 

### What Problem Does It Solve?
In today's digital age, distractions are everywhere, making it difficult to maintain deep focus on tasks. The Pomodoro Technique is a proven time management method that breaks work into intervals (traditionally 25 minutes in length), separated by short breaks. 
Focus Flow automates this process, providing a seamless, distraction-free environment to track your focus sessions, monitor your weekly progress, and build sustainable productivity habits without burning out.

## Features (Non-Technical)
* **Customizable Timers:** Switch seamlessly between Work (25 min), Short Break (5 min), and Long Break (15 min) modes.
* **Task Tracking:** Enter your current task to keep your goal front and center.
* **Session History:** Automatically saves your recently completed focus sessions so you can review what you've accomplished today.
* **Weekly Analytics:** A visual bar chart tracks your productivity over the last 7 days, helping you spot trends and stay motivated.
* **Audio & Visual Alerts:** Gentle chime sounds and browser notifications ensure you never miss the end of a session, even if the app is minimized.
* **Dark & Light Mode:** Choose your preferred aesthetic or let it sync automatically with your system settings.
* **Privacy First:** All your data (stats, history, preferences) is stored locally on your device. No accounts required, no tracking.

## Technical Details
This application is built as a modern Single Page Application (SPA) using the following technologies:
* **Frontend Framework:** React 18 with TypeScript for robust, type-safe code.
* **Build Tool:** Vite for lightning-fast Hot Module Replacement (HMR) and optimized production builds.
* **Styling:** Tailwind CSS for responsive, utility-first styling and seamless dark mode integration.
* **Icons:** `lucide-react` for clean, crisp vector icons.
* **Data Visualization:** `recharts` for rendering the responsive weekly progress bar chart.
* **State Management:** Custom React hooks (`useStickyState`) utilizing the browser's `localStorage` API to persist user data (theme, history, daily stats) across sessions.
* **Browser APIs:** Utilizes the Web Audio API for sound alerts and the Notifications API for desktop notifications.

## How to Install and Run Locally

Follow these steps to get the project running on your local machine:

### Prerequisites
* Node.js (v18 or higher recommended)
* npm (comes with Node.js) or yarn/pnpm

### Installation Steps
1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will typically be available at `http://localhost:5173` (or port 3000 depending on the Vite configuration).

4. **Build for production:**
   ```bash
   npm run build
   ```
   The compiled assets will be placed in the `dist` folder, ready to be deployed to any static hosting service (like Vercel, Netlify, or GitHub Pages).

## Developer Suggestions & Future Roadmap
As the developer, here are a few suggestions for future enhancements:
1. **Cloud Sync Integration:** Implement Firebase or Supabase to allow users to sync their task history and stats across multiple devices.
2. **Custom Timer Durations:** Add a settings panel allowing users to customize the exact lengths of their Work, Short Break, and Long Break periods.
3. **Advanced Analytics:** Expand the Recharts implementation to show more detailed metrics, such as most productive hours of the day or task category breakdowns.
4. **Export Data:** Add a feature to let users export their history to a CSV file for their own records.
5. **PWA Support:** Configure a manifest file and service worker to make the app fully installable as a Progressive Web App (PWA) on mobile and desktop.
