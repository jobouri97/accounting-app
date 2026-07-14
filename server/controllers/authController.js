import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";

import db from "../db/index.js";

const PASSWORD_SALT_ROUNDS = 12;
const googleClient = new OAuth2Client();

function validateCredentials(body, includeName) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Account data must be an object" };
  }

  let name = null;
  if (includeName) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { error: "Name is required" };
    }

    name = body.name.trim();
    if (name.length > 100) return { error: "Name cannot exceed 100 characters" };
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    return { error: "Email is required" };
  }

  const email = body.email.trim().toLowerCase();
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email must be valid" };
  }

  if (typeof body.password !== "string" || body.password.length < 8) {
    return { error: "Password must contain at least 8 characters" };
  }

  if (Buffer.byteLength(body.password, "utf8") > 72) {
    return { error: "Password cannot exceed 72 bytes" };
  }

  return { credentials: { name, email, password: body.password } };
}

function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) return reject(regenerateError);

      req.session.userId = userId;
      req.session.save((saveError) => {
        if (saveError) return reject(saveError);
        resolve();
      });
    });
  });
}

export async function register(req, res) {
  try {
    const validation = validateCredentials(req.body, true);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { name, email, password } = validation.credentials;
    const existingResult = await db.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    await startSession(req, user.id);
    res.status(201).json({ user });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email is already in use" });
    }

    console.error("Register error:", error);
    res.status(500).json({ message: "Failed to register" });
  }
}

export async function login(req, res) {
  try {
    const validation = validateCredentials(req.body, false);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { email, password } = validation.credentials;
    const result = await db.query(
      `SELECT id, name, email, password_hash, created_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );
    const account = result.rows[0];

    let passwordMatches = false;
    if (account) {
      try {
        passwordMatches = await bcrypt.compare(password, account.password_hash);
      } catch {
        passwordMatches = false;
      }
    }

    if (!account || !passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await startSession(req, account.id);
    res.status(200).json({
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        created_at: account.created_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in" });
  }
}

export async function googleLogin(req, res) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return res.status(503).json({ message: "Google login is not configured" });
  }

  if (typeof req.body?.credential !== "string" || !req.body.credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  let profile;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential,
      audience: googleClientId,
    });
    profile = ticket.getPayload();

    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      return res.status(401).json({ message: "Google account email could not be verified" });
    }
  } catch (error) {
    console.warn("Google credential verification failed:", error.message);
    return res.status(401).json({ message: "Google login failed" });
  }

  const email = profile.email.trim().toLowerCase();
  const name = (profile.name?.trim() || email.split("@")[0]).slice(0, 100);

  let client;
  let user;
  try {
    client = await db.connect();
    await client.query("BEGIN");

    let result = await client.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE google_sub = $1
       LIMIT 1`,
      [profile.sub]
    );

    if (result.rows.length === 0) {
      result = await client.query(
        `SELECT id, name, email, created_at
         FROM users
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1
         FOR UPDATE`,
        [email]
      );

      if (result.rows.length > 0) {
        result = await client.query(
          `UPDATE users
           SET google_sub = $1
           WHERE id = $2
           RETURNING id, name, email, created_at`,
          [profile.sub, result.rows[0].id]
        );
      } else {
        result = await client.query(
          `INSERT INTO users (name, email, password_hash, google_sub, created_at)
           VALUES ($1, $2, NULL, $3, NOW())
           RETURNING id, name, email, created_at`,
          [name, email, profile.sub]
        );
      }
    }

    await client.query("COMMIT");
    user = result.rows[0];
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});

    if (error.code === "23505") {
      return res.status(409).json({ message: "This Google account is linked to another user" });
    }

    console.error("Google account database error:", error);
    return res.status(500).json({ message: "Failed to save Google account" });
  } finally {
    client?.release();
  }

  try {
    await startSession(req, user.id);
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Google session error:", error);
    return res.status(500).json({ message: "Failed to start login session" });
  }
}

export async function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Failed to log out" });
    }

    res.clearCookie("accounting.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
}

export async function getCurrentUser(req, res) {
  try {
    const result = await db.query(
      `SELECT id, name, email, created_at FROM users WHERE id = $1`,
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return req.session.destroy(() =>
        res.status(401).json({ message: "Authentication required" })
      );
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Failed to retrieve account" });
  }
}
