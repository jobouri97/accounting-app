import db from "../db/index.js";

const USER_ID =2;

//-----------------------------GET ALL PRODUCTS-----------------------------

export async function getAllProducts(req, res) {
  try {
    const result = await db.query(
      `SELECT id, user_id, name, price, stock_quantity
       FROM products
       WHERE user_id = $1
       ORDER BY id DESC`,
      [USER_ID]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      message: "Failed to retrieve products",
    });
  }
}

//-----------------------------GET ONE PRODUCT BY ID-----------------------------

export async function getProductById(req, res) {
  try {
    const productId = req.params.id;

    const result = await db.query(
      `SELECT id, name, price, stock_quantity
       FROM products
       WHERE id = $1 AND user_id = $2`,
      [productId, USER_ID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      message: "Failed to retrieve product",
    });
  }
}

//-----------------------------CREATE NEW PRODUCT-----------------------------

export async function createProduct(req, res) {
  try {
    const { name, price, stock_quantity = 0 } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        message: "Product name and price are required",
      });
    }

    const numericPrice = Number(price);
    const numericStockQuantity = Number(stock_quantity);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number",
      });
    }

    if (
      !Number.isInteger(numericStockQuantity) ||
      numericStockQuantity < 0
    ) {
      return res.status(400).json({
        message: "Stock quantity must be a non-negative integer",
      });
    }

    const result = await db.query(
      `INSERT INTO products
        (user_id, name, price, stock_quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, name, price, stock_quantity`,
      [
        USER_ID,
        name.trim(),
        numericPrice,
        numericStockQuantity,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      message: "Failed to create product",
    });
  }
}

//-----------------------------UPDATE PRODUCT-----------------------------
export async function updateProduct(req, res) {
  try {
    const productId = req.params.id;
    const { name, price, stock_quantity } = req.body;

    if (
      !name ||
      price === undefined ||
      stock_quantity === undefined
    ) {
      return res.status(400).json({
        message: "Name, price and stock quantity are required",
      });
    }

    const numericPrice = Number(price);
    const numericStockQuantity = Number(stock_quantity);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number",
      });
    }

    if (
      !Number.isInteger(numericStockQuantity) ||
      numericStockQuantity < 0
    ) {
      return res.status(400).json({
        message: "Stock quantity must be a non-negative integer",
      });
    }

    const result = await db.query(
      `UPDATE products
       SET name = $1,
           price = $2,
           stock_quantity = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, name, price, stock_quantity`,
      [
        name.trim(),
        numericPrice,
        numericStockQuantity,
        productId,
        USER_ID,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      message: "Failed to update product",
    });
  }
}

//-----------------------------DELETE PRODUCT-----------------------------

export async function deleteProduct(req, res) {
  try {
    const productId = req.params.id;

    const result = await db.query(
      `DELETE FROM products
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [productId, USER_ID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      productId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
}