# Quick Start Guide

## Setup Instructions

### Step 1: Install Node.js (if not already installed)
Download from https://nodejs.org/ (LTS version recommended)

### Step 2: Install Dependencies
Open PowerShell in the project directory and run:
```powershell
npm install
```

This will install all required packages including React, React Router, and React Scripts.

### Step 3: Start the Development Server
```powershell
npm start
```

The browser will automatically open to `http://localhost:3000`

## Test Credentials (Demo)

You can login with any credentials:
- Email: `student@example.com`
- Password: `password123`

Or use:
- Email: `john@test.com`
- Password: `any-password`

## Test Flow

1. **Login Page**: Sign in with any email/password combination
2. **Dashboard**: View exam details and click "Start Test"
3. **Instructions**: Read instructions and click "Confirm & Begin Test"
4. **Test Interface**: 
   - Answer 100 MCQ questions
   - Use Previous/Next to navigate
   - Click on question numbers in the palette to jump
   - Watch the countdown timer (2 hours total)
5. **Submit**: Click "Submit Test" button
6. **Confirmation**: Review attempted/unattempted count
7. **Success**: See submission confirmation with reference ID

## Features Demonstrated

✅ Student Dashboard with exam details
✅ Instructions page with comprehensive guidelines
✅ 100 MCQ questions with proper rendering
✅ Real-time countdown timer (HH:MM:SS)
✅ Auto-submit when timer reaches zero
✅ Question status tracking (visited/answered/not-visited)
✅ Color-coded question palette (white/red/green)
✅ Submit confirmation modal
✅ Professional, modern UI with gradient backgrounds
✅ Fully responsive layout
✅ Smooth animations and transitions

## Customization

### Change Exam Duration
Edit `src/data/mockData.js`:
```javascript
duration: 60, // Change from 120 to 60 minutes
```

### Change Number of Questions
Edit `src/data/mockData.js`:
```javascript
totalQuestions: 50, // Change from 100 to 50
```

### Change Exam Name
Edit `src/data/mockData.js`:
```javascript
examName: 'My Custom Exam',
```

### Update Instructions
Edit `src/data/mockData.js` - the `instructionsData` object contains all text.

## Build for Production

When ready to deploy:
```powershell
npm run build
```

This creates an optimized production build in the `build` folder.

## Troubleshooting

**Port 3000 already in use?**
```powershell
npm start -- --port 3001
```

**Dependencies not installing?**
```powershell
npm install --legacy-peer-deps
```

**Clear cache and reinstall:**
```powershell
rmdir -r node_modules
npm install
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Create production build
- `npm test` - Run tests (if configured)

## Support

For issues or questions, check:
- Browser console (F12) for errors
- Ensure you have the latest Node.js version
- Try clearing browser cache (Ctrl+Shift+Delete)

---

Enjoy your CET Exam Testing Platform! 🎓
