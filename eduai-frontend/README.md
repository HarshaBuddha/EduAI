# EduAI Frontend

React + Vite frontend for the EduAI adaptive learning platform.

## Setup

1. Copy the files from `src/` into your existing Vite project's `src/` folder.

2. Install the Google Fonts link in your `index.html` (already handled via CSS `@import`).

3. Make sure your `main.jsx` renders `<App />`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

4. Configure your backend URL in `src/api.js`:
```js
const BASE_URL = "http://localhost:8000"; // change if needed
```

5. Start the dev server:
```bash
npm run dev
```

## File Structure

```
src/
├── App.jsx             # Root component + routing
├── App.css             # Global styles + design tokens
├── api.js              # All backend API calls
├── components/
│   ├── Sidebar.jsx     # Navigation sidebar
│   └── Sidebar.css
└── pages/
    ├── Dashboard.jsx   # Analytics + adaptive quiz
    ├── Dashboard.css
    ├── Chatbot.jsx     # AI chat assistant
    ├── Chatbot.css
    ├── Quiz.jsx        # Quiz generator + submission
    ├── Quiz.css
    ├── Summarizer.jsx  # Topic summarizer
    └── Summarizer.css
```

## API Routes Used

| Page       | Route                  | Method |
|------------|------------------------|--------|
| Chat       | /ai/chat               | POST   |
| Summarizer | /ai/summary            | POST   |
| Quiz       | /ai/quiz               | POST   |
| Quiz       | /ai/submit-quiz        | POST   |
| Dashboard  | /ai/analytics          | GET    |
| Dashboard  | /ai/adaptive-quiz      | GET    |

## Notes

- The quiz parser handles both JSON array responses and raw text fallback.
- CORS must be enabled on the backend (already done in your `main.py`).
- The `BASE_URL` in `api.js` defaults to `http://localhost:8000`.