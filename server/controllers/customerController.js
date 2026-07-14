import db from "../db/index.js";
import { currentUserId } from "../middleware/auth.js";

const USER_ID = currentUserId;
const PAGE_SIZE = 100;

function parseCustomerId(value) {
  const customerId = Number(value);
  return Number.isInteger(customerId) && customerId > 0
    ? customerId
    : null;
}

function validateCustomer(body) {
  const { customer_name, phone, notes } = body;

  if (typeof customer_name !== "string" || !customer_name.trim()) {
    return { error: "Customer name is required" };
  }

  const normalizedName = customer_name.trim();
  if (normalizedName.length > 150) {
    return { error: "Customer name cannot exceed 150 characters" };
  }

  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    return { error: "Phone must be text" };
  }

  const normalizedPhone = phone?.trim() || null;
  if (normalizedPhone && normalizedPhone.length > 30) {
    return { error: "Phone cannot exceed 30 characters" };
  }

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return { error: "Notes must be text" };
  }

  const normalizedNotes = notes?.trim() || null;

  return {
    customer: {
      customerName: normalizedName,
      phone: normalizedPhone,
      notes: normalizedNotes,
    },
  };
}

export async function getAllCustomers(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const search = req.query.search?.trim() || "";

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        message: "Page must be a positive integer",
      });
    }

    if (search.length > 150) {
      return res.status(400).json({
        message: "Search cannot exceed 150 characters",
      });
    }

    const offset = (page - 1) * PAGE_SIZE;
    const searchPattern = `%${search}%`;

    const [customersResult, countResult] = await Promise.all([
      db.query(
        `SELECT customers.id,
                customers.user_id,
                customers.customer_name,
                customers.phone,
                customers.notes,
                COALESCE((
                  SELECT SUM(transactions.credit - transactions.debit)
                  FROM transactions
                  WHERE transactions.customer_id = customers.id
                    AND transactions.user_id = customers.user_id
                ), 0) AS balance
         FROM customers
         WHERE customers.user_id = $1
           AND (
             customers.customer_name ILIKE $2
             OR COALESCE(customers.phone, '') ILIKE $2
           )
         ORDER BY customers.id DESC
         LIMIT $3 OFFSET $4`,
        [USER_ID, searchPattern, PAGE_SIZE, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM customers
         WHERE user_id = $1
           AND (
             customer_name ILIKE $2
             OR COALESCE(phone, '') ILIKE $2
           )`,
        [USER_ID, searchPattern]
      ),
    ]);

    const totalItems = countResult.rows[0].total;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    res.status(200).json({
      customers: customersResult.rows,
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
    console.error("Get customers error:", error);
    res.status(500).json({ message: "Failed to retrieve customers" });
  }
}

export async function getCustomerById(req, res) {
  try {
    const customerId = parseCustomerId(req.params.id);

    if (!customerId) {
      return res.status(400).json({
        message: "Customer ID must be a positive integer",
      });
    }

    const result = await db.query(
      `SELECT customers.id,
              customers.user_id,
              customers.customer_name,
              customers.phone,
              customers.notes,
              COALESCE((
                SELECT SUM(transactions.credit - transactions.debit)
                FROM transactions
                WHERE transactions.customer_id = customers.id
                  AND transactions.user_id = customers.user_id
              ), 0) AS balance
       FROM customers
       WHERE customers.id = $1 AND customers.user_id = $2`,
      [customerId, USER_ID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get customer error:", error);
    res.status(500).json({ message: "Failed to retrieve customer" });
  }
}

export async function createCustomer(req, res) {
  try {
    const validation = validateCustomer(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { customerName, phone, notes } = validation.customer;
    const result = await db.query(
      `INSERT INTO customers (user_id, customer_name, phone, notes, balance)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING id, user_id, customer_name, phone, notes, balance`,
      [USER_ID, customerName, phone, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ message: "Failed to create customer" });
  }
}

export async function updateCustomer(req, res) {
  try {
    const customerId = parseCustomerId(req.params.id);

    if (!customerId) {
      return res.status(400).json({
        message: "Customer ID must be a positive integer",
      });
    }

    const validation = validateCustomer(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { customerName, phone, notes } = validation.customer;
    const result = await db.query(
      `UPDATE customers
       SET customer_name = $1,
           phone = $2,
           notes = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, customer_name, phone, notes, balance`,
      [customerName, phone, notes, customerId, USER_ID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ message: "Failed to update customer" });
  }
}

export async function deleteCustomer(req, res) {
  let client;

  try {
    const customerId = parseCustomerId(req.params.id);

    if (!customerId) {
      return res.status(400).json({
        message: "Customer ID must be a positive integer",
      });
    }

    client = await db.connect();
    await client.query("BEGIN");

    const customerResult = await client.query(
      `SELECT id FROM customers
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [customerId, USER_ID]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Customer not found" });
    }

    const invoiceResult = await client.query(
      `SELECT id FROM invoices WHERE customer_id = $1 AND user_id = $2 LIMIT 1`,
      [customerId, USER_ID]
    );

    if (invoiceResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Customer cannot be deleted because it has invoices",
      });
    }

    await client.query(
      `DELETE FROM customers WHERE id = $1 AND user_id = $2`,
      [customerId, USER_ID]
    );
    await client.query("COMMIT");

    res.status(200).json({
      message: "Customer deleted successfully",
      customerId,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");

    if (error.code === "23503") {
      return res.status(409).json({
        message: "Customer cannot be deleted because it is in use",
      });
    }

    console.error("Delete customer error:", error);
    res.status(500).json({ message: "Failed to delete customer" });
  } finally {
    client?.release();
  }
}
