import { useState } from "react";

import FormError from "./FormError";
import "./ProductForm.css";
import "./CustomerForm.css";

const initialCustomerState = {
  customer_name: "",
  phone: "",
  notes: "",
};

function getInitialCustomerState(editingCustomer) {
  if (!editingCustomer) {
    return initialCustomerState;
  }

  return {
    customer_name: editingCustomer.customer_name,
    phone: editingCustomer.phone ?? "",
    notes: editingCustomer.notes ?? "",
  };
}

function CustomerForm({
  onAddCustomer,
  editingCustomer,
  onUpdateCustomer,
  onCancelEdit,
}) {
  const [customer, setCustomer] = useState(() =>
    getInitialCustomerState(editingCustomer)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setCustomer((previousCustomer) => ({
      ...previousCustomer,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!customer.customer_name.trim()) {
      setFormError("Please enter the customer name.");
      return;
    }

    const customerData = {
      customer_name: customer.customer_name.trim(),
      phone: customer.phone.trim() || null,
      notes: customer.notes.trim() || null,
    };

    try {
      setIsSubmitting(true);

      const result = editingCustomer
        ? await onUpdateCustomer(editingCustomer.id, customerData)
        : await onAddCustomer(customerData);

      if (result.success) {
        setCustomer(initialCustomerState);
      } else {
        setFormError(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="product-form-card customer-form-card">
      <div className="section-heading">
        <h2>{editingCustomer ? "Edit Customer" : "Add New Customer"}</h2>
      </div>

      <FormError
        message={formError}
        onDismiss={() => setFormError("")}
      />

      <form className="product-form customer-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="customer-name">Customer Name</label>
          <input
            id="customer-name"
            name="customer_name"
            value={customer.customer_name}
            onChange={handleChange}
            placeholder="Example: Ahmad Khalil"
            maxLength="150"
          />
        </div>

        <div className="form-group">
          <label htmlFor="customer-phone">Phone</label>
          <input
            id="customer-phone"
            type="tel"
            name="phone"
            value={customer.phone}
            onChange={handleChange}
            placeholder="Example: +961 70 123 456"
            maxLength="30"
          />
        </div>

        <div className="form-group">
          <label htmlFor="customer-notes">Notes</label>
          <input
            id="customer-notes"
            type="text"
            name="notes"
            value={customer.notes}
            onChange={handleChange}
            placeholder="Optional notes about this customer"
          />
        </div>

        <div className="form-actions">
          {editingCustomer && (
            <button
              className="cancel-button"
              type="button"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}

          <button
            className="add-product-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? editingCustomer
                ? "Updating..."
                : "Adding..."
              : editingCustomer
                ? "Update Customer"
                : "Add Customer"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CustomerForm;
