import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { config } from "../config";
import { createUser, findUserByEmail, ensureWalletForUser } from "../models/userModel";
import { HttpError } from "../utils/httpError";

dotenv.config();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new HttpError(400, "Missing ADMIN_EMAIL / ADMIN_PASSWORD in env");
  }

  const existing = await findUserByEmail(adminEmail);
  if (existing) {
    // eslint-disable-next-line no-console
    console.log("Admin already exists, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, config.security.bcryptSaltRounds);
  const userId = await createUser({
    name: "Admin",
    email: adminEmail,
    passwordHash,
    role: "admin",
  });
  await ensureWalletForUser(userId, 0);
  // eslint-disable-next-line no-console
  console.log(`Admin user created: ${adminEmail}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });

