# Felicity Dashboard 2026

Event management platform for Felicity built with the MERN stack. Handles event creation, registrations, merchandise sales, ticketing with QR codes, team-based hackathon signups, and real-time discussion forums.

made by pranav :)

---

## Tech Stack & Libraries

### Frontend

| Library | Why I Used It |
|---------|---------------|
| **React 18 + Vite** | Started with Create React App because that's what I was used to, but the dev server was unbearably slow — like 8 seconds to reflect a single CSS change. Switched to Vite and it was instant. Never looked back. |
| **React Router v6** | Needed client-side routing for the role-based dashboards. v6's nested routes and the `useNavigate` hook made protected routing way cleaner than v5's `<Redirect>` approach. |
| **Axios** | Started with native `fetch` but got tired of writing `response.json()` everywhere and manually checking `response.ok`. Axios gives me interceptors too, I use one to auto-attach the JWT token and another to catch 401s and redirect to login. Saves a ton of boilerplate. |
| **Tailwind CSS + DaisyUI** | Tried plain Tailwind first and it was fine, but I was spending too long picking exact colors and building components from scratch. DaisyUI gives me prebuilt things like modals, tabs, badges, and tables that look cohesive out of the box. Used the "nord" theme to not look like every other Tailwind project. |
| **react-hot-toast** | Needed a notification library. Tried react-toastify first but it required importing a separate CSS file and the default styling felt heavy. react-hot-toast is lighter, looks cleaner, and needs zero CSS imports. |
| **react-icons** | Just for a few icons in the navbar and buttons (trash, archive, etc). Didn't want to install an entire icon font for like 10 icons. |
| **qrcode.react** | Renders QR codes as SVGs in the ticket modal. The backend generates QR data URLs too (for emails), but for the in-app view, rendering client-side is cleaner than embedding a base64 image. |
| **socket.io-client** | Powers the real-time discussion forum. Considered using Server-Sent Events (simpler, no library needed) but the forum needs bidirectional communication — participants post messages AND receive them — so WebSockets via Socket.io was the right call. |

### Backend

| Library | Why I Used It |
|---------|---------------|
| **Express.js** | The assignment requires it. Even if it didn't, Express is what I know best and it gets out of the way. |
| **Mongoose** | I know the assignment says MongoDB, and I could've used the raw driver, but Mongoose gives me schema validation, pre-save hooks, and populate() for references. Without it I'd be writing validation logic everywhere. The Q&A confirmed Mongoose is allowed. |
| **bcrypt** | For hashing passwords. Assignment explicitly requires bcrypt. Considered bcryptjs (pure JS, no native deps) but bcrypt is faster and I didn't run into any build issues. |
| **jsonwebtoken** | JWT auth is required by the spec. This is the standard library. Nothing fancy here. |
| **Nodemailer** | For sending ticket emails with embedded QR codes. Initially tried just generating tickets in-app without emails, but the spec says emails must actually be sent. Set up with Gmail SMTP using an app password. |
| **qrcode** | Generates QR code data URLs on the backend for embedding in emails. The tickets contain the QR both in the email (as an embedded image) and in the app (rendered by qrcode.react). |
| **multer** | File upload middleware for payment proof images. Stores files locally in `uploads/`. Considered Cloudinary for cloud storage but that's overkill for this — local storage works fine and keeps things simple. |
| **socket.io** | Server-side WebSocket support for the real-time forum. Pairs with socket.io-client on the frontend. Handles room-based broadcasting so messages only go to people viewing the same event. |
| **dotenv** | Loads `.env` files. Every Node project needs this. |
| **nodemon** | Dev dependency — auto-restarts the server on file changes. |

### Database

**MongoDB Atlas** - free tier cluster. Chose Mongoose as the ODM (see above). The data model uses separate collections for participants, organizers, and admins rather than a single `users` collection with a role field. I went back and forth on this — a single collection would mean simpler auth queries, but the schemas are genuinely different (participants have interests and followed clubs, organizers have categories and webhook URLs, admins have basically nothing). Separate collections felt more natural and avoids a bunch of optional fields.

---

## Advanced Features Implemented

### Tier B (6 marks each — chose 2)

**2. Organizer Password Reset Workflow**

- **Why this one:** The spec says organizer passwords are managed by the admin, and organizers can't self-reset. So there needs to be a request/approval flow. It's also the simplest Tier B feature, and I was running low on time after the forum.
- **How it works:** Organizer goes to their profile page, types an optional reason, and submits a reset request. Admin sees it in their "Password Resets" page with the club name, date, and reason. Admin can approve (system generates a new random password that admin shares with the organizer) or reject with a comment. The organizer can see the status of their requests on their profile page.
- **Design decision:** The new password is shown to the admin exactly once after approval. There's no email integration here for sending it to the organizer — the admin is expected to share it manually (via WhatsApp, in person, etc). I considered auto-emailing the new password to the organizer's contact email, but the spec implies the admin should be the intermediary.

---

## Setup & Installation (Local)

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### Backend

```bash
cd backend
# edit .env with your MongoDB URI, JWT secret, mail credentials, admin creds
npm install
npm run seed   # creates the admin account
npm run dev    # starts on port 5000
```

### Frontend

```bash
cd frontend
# set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev    # starts on port 5173
```

### Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=7d
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=Admin@123
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000/api
```

---

## Project Structure

```
felicity/
├── backend/
│   ├── src/
│   │   ├── config/         # db connection, env vars
│   │   ├── middleware/      # JWT auth, role checks, multer upload
│   │   ├── models/          # Mongoose schemas (7 models)
│   │   ├── routes/          # Express route handlers
│   │   ├── services/        # email (nodemailer)
│   │   ├── utils/           # password hashing, JWT helpers, ID generators
│   │   ├── seed.js          # admin account seeder
│   │   └── index.js         # server entry point
│   └── uploads/             # payment proof images
│
├── frontend/
│   ├── src/
│   │   ├── api/             # axios client with interceptors
│   │   ├── components/      # FormBuilder, MerchBuilder, TicketModal, Navbar
│   │   ├── context/         # AuthContext (JWT + user state)
│   │   ├── pages/
│   │   │   ├── admin/       # Dashboard, ManageOrganizers, PasswordResets
│   │   │   ├── auth/        # Login, Register, Onboarding
│   │   │   ├── organizer/   # Dashboard, CreateEvent, EditEvent, EventDetail, Profile
│   │   │   └── participant/ # Dashboard, BrowseEvents, EventDetail, Profile, Clubs
│   │   └── App.jsx          # router setup
│   └── vercel.json          # SPA rewrite rules
│
├── deployment.txt
└── README.md
```

---

## Deployment

- **Frontend:** Vercel (Vite static build)
- **Backend:** Render (Node.js web service)
- **Database:** MongoDB Atlas (free tier)

See `deployment.txt` for production URLs.