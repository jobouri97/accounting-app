import db from "../db/index.js";

const USER_ID = 1;
const PAGE_SIZE = 100;
const MAX_ITEMS = 100;
const MAX_AMOUNT = 9999999999.99;

function parsePositiveInteger(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parseMoney(value, fieldName, defaultValue = null) {
  if (value === undefined || value === null || value === "") {
    if (defaultValue !== null) return { amount: defaultValue };
    return { error: `${fieldName} is required` };
  }

  const normalizedValue = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    return { error: `${fieldName} must be a non-negative amount with at most 2 decimal places` };
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount > MAX_AMOUNT) {
    return { error: `${fieldName} exceeds the allowed amount` };
  }

  return { amount };
}

function roundMoney(amount) {
  return Number(amount.toFixed(2));
}

function validateInvoice(body) {
  const customerId = parsePositiveInteger(body.customer_id);
  if (!customerId) {
    return { error: "Customer ID must be a positive integer" };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { error: "Invoice must contain at least one item" };
  }

  if (body.items.length > MAX_ITEMS) {
    return { error: `Invoice cannot contain more than ${MAX_ITEMS} items` };
  }

  const productIds = new Set();
  const items = [];

  for (const [index, item] of body.items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { error: `Item ${index + 1} must be an object` };
    }

    const productId = parsePositiveInteger(item.product_id);
    if (!productId) {
      return { error: `Item ${index + 1} product ID must be a positive integer` };
    }

    if (productIds.has(productId)) {
      return { error: `Product ${productId} appears more than once` };
    }

    const quantity = parsePositiveInteger(item.quantity);
    if (!quantity) {
      return { error: `Item ${index + 1} quantity must be a positive integer` };
    }

    const discountResult = parseMoney(
      item.discount,
      `Item ${index + 1} discount`,
      0
    );
    if (discountResult.error) return discountResult;

    productIds.add(productId);
    items.push({ productId, quantity, discount: discountResult.amount });
  }

  return { invoice: { customerId, items } };
}

function buildInvoiceItems(items, products) {
  const productsById = new Map(
    products.map((product) => [Number(product.id), product])
  );
  const invoiceItems = [];
  let total = 0;

  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) {
      return { error: `Product ${item.productId} not found`, status: 404 };
    }

    const purchaseResult = parseMoney(product.purchase_price, "Purchase price");
    const sellingResult = parseMoney(product.selling_price, "Selling price");

    if (purchaseResult.error || sellingResult.error) {
      return { error: "A product contains an invalid price", status: 500 };
    }

    const profit = roundMoney(sellingResult.amount - purchaseResult.amount);
    if (item.discount >= profit) {
      return {
        error: `Discount for product ${item.productId} must be less than its profit`,
        status: 400,
      };
    }

    if (item.quantity > Number(product.stock_quantity)) {
      return {
        error: `Insufficient stock for ${product.name}`,
        status: 409,
      };
    }

    const lineTotal = roundMoney(
      (sellingResult.amount - item.discount) * item.quantity
    );
    total = roundMoney(total + lineTotal);

    if (total > MAX_AMOUNT) {
      return { error: "Invoice total exceeds the allowed amount", status: 400 };
    }

    invoiceItems.push({
      ...item,
      productName: product.name,
      purchasePrice: purchaseResult.amount.toFixed(2),
      sellingPrice: sellingResult.amount.toFixed(2),
      discount: item.discount.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
    });
  }

  return { invoiceItems, total: total.toFixed(2) };
}

async function lockProducts(client, productIds) {
  if (productIds.length === 0) return [];

  const result = await client.query(
    `SELECT id, name, purchase_price, selling_price, stock_quantity
     FROM products
     WHERE id = ANY($1::int[]) AND user_id = $2
     ORDER BY id
     FOR UPDATE`,
    [productIds, USER_ID]
  );

  return result.rows;
}

async function insertInvoiceItems(client, invoiceId, items) {
  const insertedItems = [];

  for (const item of items) {
    const result = await client.query(
      `INSERT INTO invoice_items
         (invoice_id, product_id, quantity, purchase_price, selling_price, discount)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, invoice_id, product_id, quantity, purchase_price, selling_price, discount`,
      [
        invoiceId,
        item.productId,
        item.quantity,
        item.purchasePrice,
        item.sellingPrice,
        item.discount,
      ]
    );

    insertedItems.push({
      ...result.rows[0],
      product_name: item.productName,
      line_total: item.lineTotal,
    });
  }

  return insertedItems;
}

async function applyStockChanges(client, invoiceId, changes, description) {
  for (const { productId, quantity } of changes) {
    if (quantity === 0) continue;

    await client.query(
      `UPDATE products
       SET stock_quantity = stock_quantity + $1
       WHERE id = $2 AND user_id = $3`,
      [quantity, productId, USER_ID]
    );

    await client.query(
      `INSERT INTO stock_history
         (product_id, user_id, quantity, description, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [productId, USER_ID, quantity, `${description} #${invoiceId}`]
    );
  }
}

export async function getAllInvoices(req, res) {
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
      customerCondition = `AND invoices.customer_id = $${values.length}`;
    }

    const limitPosition = values.length + 1;
    const offsetPosition = values.length + 2;
    const offset = (page - 1) * PAGE_SIZE;

    const [invoicesResult, countResult] = await Promise.all([
      db.query(
        `SELECT invoices.id,
                invoices.user_id,
                invoices.customer_id,
                invoices.total,
                invoices.created_at,
                customers.customer_name,
                COUNT(invoice_items.id)::int AS item_count
         FROM invoices
         INNER JOIN customers
           ON customers.id = invoices.customer_id
          AND customers.user_id = invoices.user_id
         LEFT JOIN invoice_items ON invoice_items.invoice_id = invoices.id
         WHERE invoices.user_id = $1
           ${customerCondition}
         GROUP BY invoices.id, customers.customer_name
         ORDER BY invoices.created_at DESC, invoices.id DESC
         LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
        [...values, PAGE_SIZE, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM invoices
         WHERE user_id = $1
           ${customerCondition}`,
        values
      ),
    ]);

    const totalItems = countResult.rows[0].total;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    res.status(200).json({
      invoices: invoicesResult.rows,
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
    console.error("Get invoices error:", error);
    res.status(500).json({ message: "Failed to retrieve invoices" });
  }
}

export async function getInvoiceById(req, res) {
  try {
    const invoiceId = parsePositiveInteger(req.params.id);
    if (!invoiceId) {
      return res.status(400).json({ message: "Invoice ID must be a positive integer" });
    }

    const invoiceResult = await db.query(
      `SELECT invoices.id,
              invoices.user_id,
              invoices.customer_id,
              invoices.total,
              invoices.created_at,
              customers.customer_name
       FROM invoices
       INNER JOIN customers
         ON customers.id = invoices.customer_id
        AND customers.user_id = invoices.user_id
       WHERE invoices.id = $1 AND invoices.user_id = $2`,
      [invoiceId, USER_ID]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const itemsResult = await db.query(
      `SELECT invoice_items.id,
              invoice_items.invoice_id,
              invoice_items.product_id,
              invoice_items.quantity,
              invoice_items.purchase_price,
              invoice_items.selling_price,
              invoice_items.discount,
              products.name AS product_name,
              ((invoice_items.selling_price - invoice_items.discount) * invoice_items.quantity)
                AS line_total
       FROM invoice_items
       INNER JOIN products
         ON products.id = invoice_items.product_id
        AND products.user_id = $2
       WHERE invoice_items.invoice_id = $1
       ORDER BY invoice_items.id`,
      [invoiceId, USER_ID]
    );

    res.status(200).json({
      invoice: invoiceResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ message: "Failed to retrieve invoice" });
  }
}

export async function createInvoice(req, res) {
  const validation = validateInvoice(req.body);
  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  let client;
  try {
    client = await db.connect();
    await client.query("BEGIN");

    const { customerId, items } = validation.invoice;
    const customerResult = await client.query(
      `SELECT id, customer_name
       FROM customers
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [customerId, USER_ID]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Customer not found" });
    }

    const products = await lockProducts(client, items.map((item) => item.productId));
    const builtInvoice = buildInvoiceItems(items, products);

    if (builtInvoice.error) {
      await client.query("ROLLBACK");
      return res.status(builtInvoice.status).json({ message: builtInvoice.error });
    }

    const invoiceResult = await client.query(
      `INSERT INTO invoices (user_id, customer_id, total, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, user_id, customer_id, total, created_at`,
      [USER_ID, customerId, builtInvoice.total]
    );
    const invoice = invoiceResult.rows[0];

    const insertedItems = await insertInvoiceItems(
      client,
      invoice.id,
      builtInvoice.invoiceItems
    );
    await applyStockChanges(
      client,
      invoice.id,
      builtInvoice.invoiceItems.map((item) => ({
        productId: item.productId,
        quantity: -item.quantity,
      })),
      "Invoice"
    );

    await client.query("COMMIT");
    res.status(201).json({
      invoice: {
        ...invoice,
        customer_name: customerResult.rows[0].customer_name,
      },
      items: insertedItems,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Create invoice error:", error);
    res.status(500).json({ message: "Failed to create invoice" });
  } finally {
    client?.release();
  }
}

export async function updateInvoice(req, res) {
  const invoiceId = parsePositiveInteger(req.params.id);
  if (!invoiceId) {
    return res.status(400).json({ message: "Invoice ID must be a positive integer" });
  }

  const validation = validateInvoice(req.body);
  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  let client;
  try {
    client = await db.connect();
    await client.query("BEGIN");

    const existingInvoiceResult = await client.query(
      `SELECT id FROM invoices WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [invoiceId, USER_ID]
    );
    if (existingInvoiceResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Invoice not found" });
    }

    const { customerId, items } = validation.invoice;
    const customerResult = await client.query(
      `SELECT id, customer_name
       FROM customers
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [customerId, USER_ID]
    );
    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Customer not found" });
    }

    const oldItemsResult = await client.query(
      `SELECT product_id, quantity FROM invoice_items WHERE invoice_id = $1`,
      [invoiceId]
    );
    const oldQuantities = new Map(
      oldItemsResult.rows.map((item) => [Number(item.product_id), Number(item.quantity)])
    );
    const allProductIds = [
      ...new Set([
        ...oldItemsResult.rows.map((item) => Number(item.product_id)),
        ...items.map((item) => item.productId),
      ]),
    ].sort((first, second) => first - second);

    const products = await lockProducts(client, allProductIds);
    if (products.length !== allProductIds.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Invoice contains a missing product" });
    }

    const adjustedProducts = products.map((product) => ({
      ...product,
      stock_quantity:
        Number(product.stock_quantity) + (oldQuantities.get(Number(product.id)) || 0),
    }));
    const builtInvoice = buildInvoiceItems(items, adjustedProducts);

    if (builtInvoice.error) {
      await client.query("ROLLBACK");
      return res.status(builtInvoice.status).json({ message: builtInvoice.error });
    }

    const newQuantities = new Map(items.map((item) => [item.productId, item.quantity]));
    const stockChanges = allProductIds.map((productId) => ({
      productId,
      quantity: (oldQuantities.get(productId) || 0) - (newQuantities.get(productId) || 0),
    }));

    await applyStockChanges(client, invoiceId, stockChanges, "Invoice updated");
    await client.query(`DELETE FROM invoice_items WHERE invoice_id = $1`, [invoiceId]);

    const invoiceResult = await client.query(
      `UPDATE invoices
       SET customer_id = $1, total = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, customer_id, total, created_at`,
      [customerId, builtInvoice.total, invoiceId, USER_ID]
    );
    const insertedItems = await insertInvoiceItems(
      client,
      invoiceId,
      builtInvoice.invoiceItems
    );

    await client.query("COMMIT");
    res.status(200).json({
      invoice: {
        ...invoiceResult.rows[0],
        customer_name: customerResult.rows[0].customer_name,
      },
      items: insertedItems,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Update invoice error:", error);
    res.status(500).json({ message: "Failed to update invoice" });
  } finally {
    client?.release();
  }
}

export async function deleteInvoice(req, res) {
  const invoiceId = parsePositiveInteger(req.params.id);
  if (!invoiceId) {
    return res.status(400).json({ message: "Invoice ID must be a positive integer" });
  }

  let client;
  try {
    client = await db.connect();
    await client.query("BEGIN");

    const invoiceResult = await client.query(
      `SELECT id FROM invoices WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [invoiceId, USER_ID]
    );
    if (invoiceResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Invoice not found" });
    }

    const itemsResult = await client.query(
      `SELECT product_id, quantity FROM invoice_items WHERE invoice_id = $1`,
      [invoiceId]
    );
    const productIds = itemsResult.rows
      .map((item) => Number(item.product_id))
      .sort((first, second) => first - second);
    const products = await lockProducts(client, productIds);

    if (products.length !== productIds.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Invoice contains a missing product" });
    }

    await applyStockChanges(
      client,
      invoiceId,
      itemsResult.rows.map((item) => ({
        productId: Number(item.product_id),
        quantity: Number(item.quantity),
      })),
      "Invoice deleted"
    );
    await client.query(`DELETE FROM invoice_items WHERE invoice_id = $1`, [invoiceId]);
    await client.query(`DELETE FROM invoices WHERE id = $1 AND user_id = $2`, [invoiceId, USER_ID]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Invoice deleted successfully", invoiceId });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Delete invoice error:", error);
    res.status(500).json({ message: "Failed to delete invoice" });
  } finally {
    client?.release();
  }
}
