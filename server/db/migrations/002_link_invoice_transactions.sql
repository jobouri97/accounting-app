ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS invoice_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_transactions_invoice'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_invoice
      FOREIGN KEY (invoice_id)
      REFERENCES invoices(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_invoice_id_key
ON transactions(invoice_id)
WHERE invoice_id IS NOT NULL;

INSERT INTO transactions
  (user_id, customer_id, created_at, debit, credit, note, invoice_id)
SELECT invoices.user_id,
       invoices.customer_id,
       invoices.created_at,
       invoices.total,
       0,
       'Invoice #' || invoices.id,
       invoices.id
FROM invoices
WHERE invoices.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM transactions
    WHERE transactions.invoice_id = invoices.id
  );

UPDATE customers
SET balance = COALESCE((
  SELECT SUM(transactions.credit - transactions.debit)
  FROM transactions
  WHERE transactions.customer_id = customers.id
    AND transactions.user_id = customers.user_id
), 0);
