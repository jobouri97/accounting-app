import db from "../db/index.js";

const USER_ID = 1;
const PAGE_SIZE = 100;

function parsePositiveInteger(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parseAmount(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return { amount: 0 };
  }

  const normalizedValue = String(value).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    return { error: `${fieldName} must be a non-negative amount with at most 2 decimal places` };
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount > 9999999999.99) {
    return { error: `${fieldName} exceeds the allowed amount` };
  }

  return { amount };
}

function validateTransaction(body) {
  const customerId = parsePositiveInteger(body.customer_id);

  if (!customerId) {
    return { error: "Customer ID must be a positive integer" };
  }

  const debitResult = parseAmount(body.debit, "Debit");
  if (debitResult.error) return debitResult;

  const creditResult = parseAmount(body.credit, "Credit");
  if (creditResult.error) return creditResult;

  if ((debitResult.amount > 0) === (creditResult.amount > 0)) {
    return { error: "Provide either a debit or a credit amount, but not both" };
  }

  if (body.note !== undefined && body.note !== null && typeof body.note !== "string") {
    return { error: "Note must be text" };
  }

  return {
    transaction: {
      customerId,
      debit: debitResult.amount,
      credit: creditResult.amount,
      note: body.note?.trim() || null,
    },
  };
}

export async function getAllTransactions(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const customerId = req.query.customer_id
      ? parsePositiveInteger(req.query.customer_id)
      : null;

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ message: "Page must be a positive integer" });
    }

    if (req.query.customer_id && !customerId) {
      return res.status(400).json({ message: "Customer ID must be a positive integer" });
    }

    const values = [USER_ID];
    let customerCondition = "";

    if (customerId) {
      values.push(customerId);
      customerCondition = `AND transactions.customer_id = $${values.length}`;
    }

    const limitPosition = values.length + 1;
    const offsetPosition = values.length + 2;
    const offset = (page - 1) * PAGE_SIZE;

    const [transactionsResult, countResult] = await Promise.all([
      db.query(
        `SELECT transactions.id,
                transactions.user_id,
                transactions.customer_id,
                transactions.created_at,
                transactions.debit,
                transactions.credit,
                transactions.note,
                SUM(transactions.credit - transactions.debit) OVER (
                  PARTITION BY transactions.customer_id
                  ORDER BY transactions.created_at, transactions.id
                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) AS balance,
                customers.customer_name
         FROM transactions
         INNER JOIN customers
           ON customers.id = transactions.customer_id
          AND customers.user_id = transactions.user_id
         WHERE transactions.user_id = $1
           ${customerCondition}
         ORDER BY transactions.created_at DESC, transactions.id DESC
         LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
        [...values, PAGE_SIZE, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM transactions
         WHERE transactions.user_id = $1
           ${customerCondition}`,
        values
      ),
    ]);

    const totalItems = countResult.rows[0].total;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    res.status(200).json({
      transactions: transactionsResult.rows,
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
    console.error("Get transactions error:", error);
    res.status(500).json({ message: "Failed to retrieve transactions" });
  }
}

export async function getTransactionById(req, res) {
  try {
    const transactionId = parsePositiveInteger(req.params.id);

    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID must be a positive integer" });
    }

    const result = await db.query(
      `SELECT transactions.id,
              transactions.user_id,
              transactions.customer_id,
              transactions.created_at,
              transactions.debit,
              transactions.credit,
              transactions.note,
              customers.customer_name
       FROM transactions
       INNER JOIN customers
         ON customers.id = transactions.customer_id
        AND customers.user_id = transactions.user_id
       WHERE transactions.id = $1 AND transactions.user_id = $2`,
      [transactionId, USER_ID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({ message: "Failed to retrieve transaction" });
  }
}

export async function createTransaction(req, res) {
  const validation = validateTransaction(req.body);

  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  const client = await db.connect();

  try {
    const { customerId, debit, credit, note } = validation.transaction;
    await client.query("BEGIN");

    const customerResult = await client.query(
      `SELECT id FROM customers WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [customerId, USER_ID]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Customer not found" });
    }

    const result = await client.query(
      `INSERT INTO transactions (user_id, customer_id, created_at, debit, credit, note)
       VALUES ($1, $2, NOW(), $3, $4, $5)
       RETURNING id, user_id, customer_id, created_at, debit, credit, note`,
      [USER_ID, customerId, debit, credit, note]
    );

    const balanceResult = await client.query(
      `UPDATE customers
       SET balance = balance - $1 + $2
       WHERE id = $3 AND user_id = $4
       RETURNING balance`,
      [debit, credit, customerId, USER_ID]
    );

    await client.query("COMMIT");
    res.status(201).json({
      transaction: result.rows[0],
      customerBalance: balanceResult.rows[0].balance,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create transaction error:", error);
    res.status(500).json({ message: "Failed to create transaction" });
  } finally {
    client.release();
  }
}

export async function updateTransaction(req, res) {
  const transactionId = parsePositiveInteger(req.params.id);

  if (!transactionId) {
    return res.status(400).json({ message: "Transaction ID must be a positive integer" });
  }

  if (req.body.customer_id !== undefined) {
    return res.status(400).json({ message: "Customer ID cannot be updated" });
  }

  if (
    req.body.debit === undefined &&
    req.body.credit === undefined &&
    req.body.note === undefined
  ) {
    return res.status(400).json({ message: "Provide debit, credit, or note to update" });
  }

  if (req.body.note !== undefined && req.body.note !== null && typeof req.body.note !== "string") {
    return res.status(400).json({ message: "Note must be text" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `SELECT id, customer_id, debit, credit, note
       FROM transactions
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [transactionId, USER_ID]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Transaction not found" });
    }

    const existing = existingResult.rows[0];
    
    const debitResult = parseAmount(
      req.body.debit === undefined ? existing.debit : req.body.debit,
      "Debit"
    );
    const creditResult = parseAmount(
      req.body.credit === undefined ? existing.credit : req.body.credit,
      "Credit"
    );

    if (debitResult.error || creditResult.error) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: debitResult.error || creditResult.error });
    }

    if ((debitResult.amount > 0) === (creditResult.amount > 0)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Provide either a debit or a credit amount, but not both",
      });
    }

    const debit = debitResult.amount;
    const credit = creditResult.amount;
    const note = req.body.note === undefined
      ? existing.note
      : req.body.note?.trim() || null;

    const customerResult = await client.query(
      `SELECT id FROM customers WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [existing.customer_id, USER_ID]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Customer not found" });
    }

    const balanceResult = await client.query(
       `UPDATE customers
       SET balance = balance + $1 - $2 - $3 + $4
       WHERE id = $5 AND user_id = $6
       RETURNING balance`,
      [existing.debit, existing.credit, debit, credit, existing.customer_id, USER_ID]
    );

    const result = await client.query(
      `UPDATE transactions
       SET debit = $1, credit = $2, note = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, customer_id, created_at, debit, credit, note`,
      [debit, credit, note, transactionId, USER_ID]
    );

    await client.query("COMMIT");
    res.status(200).json({
      transaction: result.rows[0],
      customerBalance: balanceResult.rows[0].balance,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update transaction error:", error);
    res.status(500).json({ message: "Failed to update transaction" });
  } finally {
    client.release();
  }
}

export async function deleteTransaction(req, res) {
  const transactionId = parsePositiveInteger(req.params.id);

  if (!transactionId) {
    return res.status(400).json({ message: "Transaction ID must be a positive integer" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT id, customer_id, debit, credit
       FROM transactions
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [transactionId, USER_ID]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Transaction not found" });
    }

    const transaction = result.rows[0];
    const balanceResult = await client.query(
      `UPDATE customers
       SET balance = balance + $1 - $2
       WHERE id = $3 AND user_id = $4
       RETURNING balance`,
      [transaction.debit, transaction.credit, transaction.customer_id, USER_ID]
    );

    await client.query(
      `DELETE FROM transactions WHERE id = $1 AND user_id = $2`,
      [transactionId, USER_ID]
    );

    await client.query("COMMIT");
    res.status(200).json({
      message: "Transaction deleted successfully",
      transactionId,
      customerBalance: balanceResult.rows[0]?.balance,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete transaction error:", error);
    res.status(500).json({ message: "Failed to delete transaction" });
  } finally {
    client.release();
  }
}
