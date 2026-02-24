import { connectDB } from "./config/db.js";
import { Admin } from "./models/index.js";
import { hashPassword } from "./utils/password.js";
import env from "./config/env.js";

async function seed() {
  await connectDB();

  const existing = await Admin.findOne({ email: env.admin.email });
  if (existing) {
    console.log("Admin account already exists, skipping seed.");
    process.exit(0);
  }

  const hashed = await hashPassword(env.admin.password);
  await Admin.create({
    email: env.admin.email,
    password: hashed,
  });

  console.log(`Admin seeded: ${env.admin.email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
