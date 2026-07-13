import { useState } from "react";

import FormError from "./FormError";
import "./TransactionForm.css";

function TransactionForm({
  customers,
  lockedCustomerId = null,
  onAddTransaction,
  editingTransaction = null,
  onUpdateTransaction,
  onCancelEdit,
  onCustomerChange,
}) {
  const editingDebit = Number(editingTransaction?.debit);
  const initialCustomerId = editingTransaction?.customer_id ?? lockedCustomerId ?? "";
  const [form, setForm] = useState({
    customer_id: initialCustomerId,
    transactionType: editingTransaction
      ? editingDebit > 0 ? "debit" : "credit"
      : "debit",
    amount: editingTransaction
      ? editingDebit > 0 ? editingTransaction.debit : editingTransaction.credit
      : "",
    note: editingTransaction?.note ?? "",
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);
  const [isTypeListOpen, setIsTypeListOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lockedCustomer = customers.find(
    (customer) => customer.id === Number(initialCustomerId)
  );
  const selectedCustomer = customers.find(
    (customer) => customer.id === Number(form.customer_id)
  );
  const isShowingSelectedCustomer =
    selectedCustomer?.customer_name === customerSearch;
  const filteredCustomers = isShowingSelectedCustomer
    ? customers
    : customers.filter((customer) =>
      customer.customer_name
        .toLowerCase()
        .includes(customerSearch.trim().toLowerCase())
    );

  function handleCustomerSearch(event) {
    setCustomerSearch(event.target.value);
    setIsCustomerListOpen(true);
    setForm((previous) => ({ ...previous, customer_id: "" }));
  }

  function handleCustomerSelect(customer) {
    setCustomerSearch(customer.customer_name);
    setIsCustomerListOpen(false);
    setForm((previous) => ({ ...previous, customer_id: customer.id }));
    onCustomerChange(customer.id);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const customerId = Number(form.customer_id);
    const amount = Number(form.amount);

    if (!Number.isInteger(customerId) || customerId < 1) {
      setFormError("Please select a customer.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      const transactionData = {
        debit: form.transactionType === "debit" ? form.amount : 0,
        credit: form.transactionType === "credit" ? form.amount : 0,
        note: form.note.trim() || null,
      };
      const result = editingTransaction
        ? await onUpdateTransaction(editingTransaction.id, transactionData)
        : await onAddTransaction({
          customer_id: customerId,
          ...transactionData,
        });

      if (!result.success) {
        setFormError(result.message);
        return;
      }

      if (!editingTransaction) {
        setForm({
          customer_id: lockedCustomerId ?? "",
          transactionType: "debit",
          amount: "",
          note: "",
        });
      }

      if (!lockedCustomerId && !editingTransaction) setCustomerSearch("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="transaction-form-card">
      <h2>{editingTransaction ? "Edit Transaction" : "New Transaction"}</h2>
      <FormError message={formError} onDismiss={() => setFormError("")} />

      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="transaction-customer">Customer</label>
          {lockedCustomerId || editingTransaction ? (
            <input
              id="transaction-customer"
              value={lockedCustomer ? `#${lockedCustomer.id} — ${lockedCustomer.customer_name}` : "Loading customer..."}
              disabled
              readOnly
            />
          ) : (
            <div className="customer-combobox">
              <input
                id="transaction-customer"
                role="combobox"
                autoComplete="off"
                aria-expanded={isCustomerListOpen}
                aria-controls="transaction-customer-options"
                value={customerSearch}
                placeholder="Search customers"
                onChange={handleCustomerSearch}
                onFocus={() => setIsCustomerListOpen(true)}
                onClick={() => setIsCustomerListOpen(true)}
                onBlur={() => window.setTimeout(() => setIsCustomerListOpen(false), 150)}
              />
              <span className="transaction-combobox-arrow" aria-hidden="true">⌄</span>
              {isCustomerListOpen && (
                <div id="transaction-customer-options" className="customer-options" role="listbox">
                  {filteredCustomers.length === 0 ? (
                    <div className="customer-option-empty">No customers found</div>
                  ) : filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="customer-option"
                      role="option"
                      aria-selected={Number(form.customer_id) === customer.id}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleCustomerSelect(customer);
                      }}
                    >
                      <span><strong>{customer.customer_name}</strong><small>ID: {customer.id}</small></span>
                      <span>{Number(customer.balance).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="transactionType">Type</label>
          <div className="transaction-type-combobox">
            <button
              id="transactionType"
              type="button"
              className="transaction-type-trigger"
              aria-haspopup="listbox"
              aria-expanded={isTypeListOpen}
              onClick={() => setIsTypeListOpen(true)}
              onBlur={() => window.setTimeout(() => setIsTypeListOpen(false), 150)}
            >
              <span className={`transaction-type-dot ${form.transactionType}`} aria-hidden="true" />
              <span>{form.transactionType === "debit" ? "Debit" : "Credit"}</span>
              <span className="transaction-type-arrow" aria-hidden="true">⌄</span>
            </button>

            {isTypeListOpen && (
              <div className="customer-options transaction-type-options" role="listbox">
                <button
                  type="button"
                  className="customer-option transaction-type-option"
                  role="option"
                  aria-selected={form.transactionType === "debit"}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setForm((previous) => ({ ...previous, transactionType: "debit" }));
                    setIsTypeListOpen(false);
                  }}
                >
                  <span className="transaction-type-icon debit">−</span>
                  <span><strong>Debit</strong><small>Decrease customer balance</small></span>
                </button>
                <button
                  type="button"
                  className="customer-option transaction-type-option"
                  role="option"
                  aria-selected={form.transactionType === "credit"}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setForm((previous) => ({ ...previous, transactionType: "credit" }));
                    setIsTypeListOpen(false);
                  }}
                >
                  <span className="transaction-type-icon credit">+</span>
                  <span><strong>Credit</strong><small>Increase customer balance</small></span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="transaction-amount">Amount</label>
          <input id="transaction-amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} placeholder="0.00" />
        </div>

        <div className="form-group">
          <label htmlFor="transaction-note">Note</label>
          <input id="transaction-note" name="note" value={form.note} onChange={handleChange} placeholder="Optional note" />
        </div>

        <div className="transaction-form-actions">
          {editingTransaction && (
            <button className="cancel-transaction-button" type="button" onClick={onCancelEdit} disabled={isSubmitting}>
              Cancel
            </button>
          )}
          <button className="save-transaction-button" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? editingTransaction ? "Updating..." : "Saving..."
              : editingTransaction ? "Update Transaction" : "Save Transaction"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default TransactionForm;
