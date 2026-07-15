ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_barcode_key;

DROP INDEX IF EXISTS products_barcode_key;

CREATE UNIQUE INDEX IF NOT EXISTS products_user_id_barcode_key
  ON products (user_id, barcode)
  WHERE barcode IS NOT NULL;
