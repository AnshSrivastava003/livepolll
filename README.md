🎉 Live Poll Battle

A real-time polling application where users can create or join rooms, vote live, and see results update instantly.
This project was built as part of my assignment and polished further to showcase my full-stack development skills.


🚀 Features

🔑 Join/Create Rooms → Simple username + room code, no password needed.

🗳 Vote Once → Each user can cast only one vote.

📡 Real-Time Updates → Votes update instantly across all users via WebSockets.

⏱ Countdown Timer → Poll lasts 60 seconds; closes automatically.

🔒 No Re-Voting → Already voted? Options are locked.

♻️ Persistence → Vote saved in local storage, even after refresh.

🎨 Modern UI → Clean, card-based design with hover effects.



🛠 Tech Stack

Frontend

React (Vite)

WebSockets (native browser API)

CSS (custom responsive design)

Backend

Node.js + Express

WebSocket (ws package)

In-memory room storage


⚙️ Installation & Running
1. Clone the repo
git clone https://github.com/yourusername/livepoll.git
cd livepoll

2. Run backend (server)
cd server
npm install
npm run dev


Backend runs on: http://localhost:8080
WebSocket: ws://localhost:8080

3. Run frontend (client)
cd client
npm install
npm run dev


Frontend runs on: http://localhost:5173



🎮 How to Use

Open the frontend in your browser.

Enter your name.

Either:

Click Create → generates a new room code and starts a poll.

Or type an existing room code and click Join.

Cast your vote (Cats vs Dogs 🐱🐶).

Open another tab with a different name to see real-time updates.

After 60 seconds → poll closes, results are final.



🌟 Future Improvements

Multiple poll questions per room

Authentication for persistent user profiles

Admin dashboard to create/manage polls

Deploy backend + frontend for public access


🙋 About Me

I’m Ansh Srivastava, a Computer Science student passionate about full-stack development and building impactful applications.
This project demonstrates my ability to design, build, and integrate frontend + backend systems with real-time features.

📧 Email: anshsrivastava0305@gmail.com

💼 LinkedIn: https://www.linkedin.com/in/anshsrivastava003/

💻 Github: https://github.com/AnshSrivastava003
