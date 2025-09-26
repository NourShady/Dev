
My College Offline PWA (Light Mode)
-----------------------------------
Files included:
- index.html
- style.css
- app.js
- manifest.json
- sw.js
- icon.png (placeholder)

How to use:
1. Upload these files to a static host (GitHub Pages, Netlify).
2. Open the site URL in Safari on iPhone, then Share -> Add to Home Screen.
3. First load requires internet to cache assets. After that app works offline.

Notes:
- Schedule is editable in app.js (scheduleData array). Each item has id, day(0=Sun..6=Sat), time (HH:MM), title, room.
- Attendance saved in localStorage as 'attendance' mapping id->bool. Notes saved as 'notes' array.
