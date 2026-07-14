import db from "../db/index.js";
import { currentUserId } from "../middleware/auth.js";

const USER_ID = currentUserId;
const PAGE_SIZE = 100;

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function getAllProfits(req, res) {
  try {
    const page = Number(req.query.page ?? 1);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ message: "Page must be a positive integer" });
    }

    const startDate = req.query.start_date || "";
    const endDate = req.query.end_date || "";

    if (startDate && !isValidDate(startDate)) {
      return res.status(400).json({ message: "Start date must be a valid date" });
    }

    if (endDate && !isValidDate(endDate)) {
      return res.status(400).json({ message: "End date must be a valid date" });
    }

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({ message: "Start date cannot be after end date" });
    }

    const offset = (page - 1) * PAGE_SIZE;
    const values = [USER_ID];
    const dateConditions = [];

    if (startDate) {
      values.push(startDate);
      dateConditions.push(`invoices.created_at >= $${values.length}::date`);
    }

    if (endDate) {
      values.push(endDate);
      dateConditions.push(
        `invoices.created_at < ($${values.length}::date + INTERVAL '1 day')`
      );
    }

    const dateFilter = dateConditions.length
      ? `AND ${dateConditions.join(" AND ")}`
      : "";
    const limitPosition = values.length + 1;
    const offsetPosition = values.length + 2;

    const [profitsResult, countResult] = await Promise.all([
      db.query(
        `SELECT invoice_items.id,
                invoice_items.product_id,
                products.name AS product_name,
                invoice_items.purchase_price,
                invoice_items.selling_price,
                invoice_items.discount,
                invoice_items.quantity,
                (invoice_items.quantity *
                  (invoice_items.selling_price - invoice_items.purchase_price)) AS profit,
                invoice_items.invoice_id,
                invoices.created_at
         FROM invoice_items
         INNER JOIN invoices
           ON invoices.id = invoice_items.invoice_id
          AND invoices.user_id = $1
         LEFT JOIN products
          ON products.id = invoice_items.product_id
          AND products.user_id = invoices.user_id
         WHERE 1 = 1
           ${dateFilter}
         ORDER BY invoices.created_at DESC, invoice_items.id DESC
         LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
        [...values, PAGE_SIZE, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total,
                COALESCE(
                  SUM(invoice_items.quantity *
                    (invoice_items.selling_price - invoice_items.purchase_price)),
                  0
                ) AS total_profit
         FROM invoice_items
         INNER JOIN invoices ON invoices.id = invoice_items.invoice_id
         WHERE invoices.user_id = $1
           ${dateFilter}`,
        values
      ),
    ]);

    const totalItems = countResult.rows[0].total;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    res.status(200).json({
      profits: profitsResult.rows,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      summary: {
        totalProfit: countResult.rows[0].total_profit,
      },
    });
  } catch (error) {
    console.error("Get profits error:", error);
    res.status(500).json({ message: "Failed to retrieve profits" });
  }
}
