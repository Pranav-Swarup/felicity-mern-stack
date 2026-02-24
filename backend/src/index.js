import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import env from "./config/env.js";

import authRoutes from "./routes/auth.js";
import participantRoutes from "./routes/participant.js";
import organizersRoutes from "./routes/organizers.js";
import adminRoutes from "./routes/admin.js";
import organizerRoutes from "./routes/organizer.js";
import eventsRoutes from "./routes/events.js";
import registrationRoutes from "./routes/registration.js";

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

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start();

export default app;
