function CustomerOptions({ customerId, customers, onCustomerSelect }) {
  if (customers.length === 0) {
    return (
      <div id="invoice-customer-options" className="invoice-customer-options" role="listbox">
        <div className="invoice-customer-empty">No customers found</div>
      </div>
    );
  }

  return (
    <div id="invoice-customer-options" className="invoice-customer-options" role="listbox">
      {customers.map((customer) => (
        <button
          key={customer.id}
          type="button"
          className="invoice-customer-option"
          role="option"
          aria-selected={Number(customerId) === customer.id}
          onMouseDown={(event) => {
            event.preventDefault();
            onCustomerSelect(customer);
          }}
        >
          <span>
            <strong>{customer.customer_name}</strong>
            <small>ID: {customer.id}</small>
          </span>
          <span>{Number(customer.balance).toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}

function CustomerSection({
  customerType,
  customerId,
  customerSearch,
  filteredCustomers,
  isCustomerListOpen,
  onCustomerTypeChange,
  onCustomerSearch,
  onCustomerSelect,
  onCustomerListOpen,
  onCustomerListClose,
}) {
  return (
    <div className="invoice-customer-section">
      <span className="invoice-section-label">Customer Type</span>

      <div className="invoice-customer-types">
        <label className={customerType === "passer" ? "selected" : ""}>
          <input
            type="radio"
            name="customerType"
            value="passer"
            checked={customerType === "passer"}
            onChange={() => onCustomerTypeChange("passer")}
          />
          <span>
            <strong>Passer Customer</strong>
            <small>Quick sale without customer details</small>
          </span>
        </label>

        <label className={customerType === "specified" ? "selected" : ""}>
          <input
            type="radio"
            name="customerType"
            value="specified"
            checked={customerType === "specified"}
            onChange={() => onCustomerTypeChange("specified")}
          />
          <span>
            <strong>Specified Customer</strong>
            <small>Select a saved customer</small>
          </span>
        </label>
      </div>

      {customerType === "specified" && (
        <div className="invoice-customer-field">
          <label htmlFor="invoice-customer">Customer</label>

          <div className="invoice-customer-combobox">
            <input
              id="invoice-customer"
              role="combobox"
              autoComplete="off"
              aria-expanded={isCustomerListOpen}
              aria-controls="invoice-customer-options"
              value={customerSearch}
              placeholder="Search customers"
              onChange={onCustomerSearch}
              onFocus={onCustomerListOpen}
              onClick={onCustomerListOpen}
              onBlur={onCustomerListClose}
            />
            <span className="invoice-combobox-arrow" aria-hidden="true">⌄</span>

            {isCustomerListOpen && (
              <CustomerOptions
                customerId={customerId}
                customers={filteredCustomers}
                onCustomerSelect={onCustomerSelect}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSection;
