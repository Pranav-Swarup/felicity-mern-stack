import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export function generateTicketId() {
  const short = uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `FEL-${short}`;
}

export function generatePassword(length = 12) {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

export function slugifyEmail(name) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug}@clubs.iiit.ac.in`;
}
