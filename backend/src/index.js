import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { Server as SocketIO } from "socket.io";
import { connectDB } from "./config/db.js";
import env from "./config/env.js";

import authRoutes from "./routes/auth.js";
import participantRoutes from "./routes/participant.js";
import organizersRoutes from "./routes/organizers.js";
import adminRoutes from "./routes/admin.js";
import organizerRoutes from "./routes/organizer.js";
import eventsRoutes from "./routes/events.js";
import registrationRoutes from "./routes/registration.js";
import passwordResetRoutes from "./routes/passwordReset.js";
import teamsRoutes from "./routes/teams.js";
import feedbackRoutes from "./routes/feedback.js";
import forumRoutes from "./routes/forum.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/participant", participantRoutes);
app.use("/api/organizers", organizersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/password-resets", passwordResetRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/forum", forumRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Something went wrong" });
});

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = new SocketIO(server, {
    cors: { origin: env.frontendUrl, credentials: true },
  });

  // forum real-time clients join eventspecific rooms
  io.on("connection", (socket) => {
    socket.on("join-event", (eventId) => {
      socket.join(`event:${eventId}`);
    });

    socket.on("leave-event", (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on("new-message", (data) => {
      // broadcast to everyone in the event room
      io.to(`event:${data.eventId}`).emit("message", data.message);
    });

    socket.on("delete-message", (data) => {
      io.to(`event:${data.eventId}`).emit("message-deleted", data.messageId);
    });
  });

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start();

export default app;
