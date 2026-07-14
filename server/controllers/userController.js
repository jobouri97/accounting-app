import bcrypt from "bcrypt";

import db from "../db/index.js";

const PAGE_SIZE = 100;
const PASSWORD_SALT_ROUNDS = 12;

function parseUserId(value) {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePassword(password, required) {
  if (password === undefined || password === null || password === "") {
    return required ? { error: "Password is required" } : { password: null };
  }

  if (typeof password !== "string") {
    return { error: "Password must be text" };
  }

  if (password.length < 8) {
    return { error: "Password must contain at least 8 characters" };
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    return { error: "Password cannot exceed 72 bytes" };
  }

  return { password };
}

function validateUser(body, passwordRequired) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "User data must be an object" };
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return { error: "Name is required" };
  }

  const name = body.name.trim();
  if (name.length > 100) {
    return { error: "Name cannot exceed 100 characters" };
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    return { error: "Email is required" };
  }

  const email = body.email.trim().toLowerCase();
  if (email.length > 255) {
    return { error: "Email cannot exceed 255 characters" };
  }

  if (!validateEmail(email)) {
    return { error: "Email must be valid" };
  }

  const passwordResult = validatePassword(body.password, passwordRequired);
  if (passwordResult.error) return passwordResult;

  return {
    user: {
      name,
      email,
      password: passwordResult.password,
    },
  };
}

async function emailBelongsToAnotherUser(email, excludedUserId = null) {
  const values = [email];
  let excludedUserCondition = "";

  if (excludedUserId) {
    values.push(excludedUserId);
    excludedUserCondition = "AND id <> $2";
  }

  const result = await db.query(
    `SELECT id
     FROM users
     WHERE LOWER(email) = LOWER($1)
       ${excludedUserCondition}
     LIMIT 1`,
    values
  );

  return result.rows.length > 0;
}

export async function getAllUsers(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const search = req.query.search?.trim() || "";

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ message: "Page must be a positive integer" });
    }

    if (search.length > 255) {
      return res.status(400).json({ message: "Search cannot exceed 255 characters" });
    }

    const offset = (page - 1) * PAGE_SIZE;
    const searchPattern = `%${search}%`;
    const [usersResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, name, email, created_at
         FROM users
         WHERE name ILIKE $1 OR email ILIKE $1
         ORDER BY id DESC
         LIMIT $2 OFFSET $3`,
        [searchPattern, PAGE_SIZE, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM users
         WHERE name ILIKE $1 OR email ILIKE $1`,
        [searchPattern]
      ),
    ]);

    const totalItems = countResult.rows[0].total;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    res.status(200).json({
      users: usersResult.rows,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to retrieve users" });
  }
}

export async function getUserById(req, res) {
  try {
    const userId = parseUserId(req.params.id);

    if (!userId) {
      return res.status(400).json({ message: "User ID must be a positive integer" });
    }

    const result = await db.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to retrieve user" });
  }
}

export async function createUser(req, res) {
  try {
    const validation = validateUser(req.body, true);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { name, email, password } = validation.user;
    if (await emailBelongsToAnotherUser(email)) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email is already in use" });
    }

    console.error("Create user error:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
}

export async function updateUser(req, res) {
  try {
    const userId = parseUserId(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "User ID must be a positive integer" });
    }

    const validation = validateUser(req.body, false);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { name, email, password } = validation.user;
    if (await emailBelongsToAnotherUser(email, userId)) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    let result;
    if (password) {
      const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
      result = await db.query(
        `UPDATE users
         SET name = $1, email = $2, password_hash = $3
         WHERE id = $4
         RETURNING id, name, email, created_at`,
        [name, email, passwordHash, userId]
      );
    } else {
      result = await db.query(
        `UPDATE users
         SET name = $1, email = $2
         WHERE id = $3
         RETURNING id, name, email, created_at`,
        [name, email, userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email is already in use" });
    }

    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
}

export async function deleteUser(req, res) {
  try {
    const userId = parseUserId(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "User ID must be a positive integer" });
    }

    const result = await db.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User deleted successfully",
      userId,
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        message: "User cannot be deleted because they have related business records",
      });
    }

    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
}
