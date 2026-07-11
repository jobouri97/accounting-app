import db from "../db/index.js";

const USER_ID = 1;

//-----------------------------GET ALL PRODUCTS-----------------------------

export async function getAllProducts(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = 100;

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        message: "Page must be a positive integer",
      });
    }

    const offset = (page - 1) * limit;

    const [productsResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, user_id, name, price, stock_quantity, barcode
         FROM products
         WHERE user_id = $1
         ORDER BY id DESC
         LIMIT $2 OFFSET $3`,
        [USER_ID, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM products
         WHERE user_id = $1`,
        [USER_ID]
      ),
    ]);

    const totalItems = countResult.rows[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      products: productsResult.rows,
      pagination: {
        page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
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
      `SELECT id, name, price, stock_quantity, barcode
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
    const {
      name,
      price,
      stock_quantity = 0,
      barcode,
    } = req.body;

    const normalizedBarcode = barcode?.trim() || null;

    if (normalizedBarcode && normalizedBarcode.length > 100) {
      return res.status(400).json({
        message: "Barcode cannot exceed 100 characters",
      });
    }

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
          (user_id, name, price, stock_quantity, barcode)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          user_id,
          name,
          price,
          stock_quantity,
          barcode`,
      [
        USER_ID,
        name.trim(),
        numericPrice,
        numericStockQuantity,
        normalizedBarcode,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (
      error.code === "23505" &&
      error.constraint === "products_barcode_key"
    ) {
      return res.status(409).json({
        message: "Barcode already exists.",
      });
    }

    console.error("Product error:", error);

    res.status(500).json({
      message: "Failed to save product",
    });
  }
}



//-----------------------------UPDATE PRODUCT-----------------------------

export async function updateProduct(req, res) {
  try {
    const productId = req.params.id;
    const {
      name,
      price,
      stock_quantity,
      barcode,
    } = req.body;

    const normalizedBarcode = barcode?.trim() || null;

    if (normalizedBarcode && normalizedBarcode.length > 100) {
      return res.status(400).json({
        message: "Barcode cannot exceed 100 characters",
      });
    }

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
            stock_quantity = $3,
            barcode = $4
        WHERE id = $5 AND user_id = $6
        RETURNING
          id,
          user_id,
          name,
          price,
          stock_quantity,
          barcode`,
      [
        name.trim(),
        numericPrice,
        numericStockQuantity,
        normalizedBarcode,
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
    if (
      error.code === "23505" &&
      error.constraint === "products_barcode_key"
    ) {
      return res.status(409).json({
        message: "Barcode already exists.",
      });
    }

    console.error("Product error:", error);

    res.status(500).json({
      message: "Failed to save product",
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