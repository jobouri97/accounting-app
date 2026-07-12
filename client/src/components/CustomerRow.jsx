import "./ProductRow.css";
import "./CustomerRow.css";

function CustomerRow({ customer, onEditCustomer, onDeleteCustomer }) {
  const balance = Number(customer.balance);

  return (
    <tr>
      <td>#{customer.id}</td>
      <td>
        <div className="product-name-cell">
          <div className="product-icon customer-icon">
            {customer.customer_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{customer.customer_name}</strong>
            <span className="product-user-id">User ID: {customer.user_id}</span>
          </div>
        </div>
      </td>
      <td>{customer.phone || "—"}</td>
      <td className={balance > 0 ? "customer-balance positive" : balance < 0 ? "customer-balance negative" : "customer-balance"}>
        ${balance.toFixed(2)}
      </td>
      <td className="customer-notes-cell" title={customer.notes || ""}>
        {customer.notes || "—"}
      </td>
      <td>
        <div className="product-actions">
          <button
            className="edit-button"
            type="button"
            onClick={() => onEditCustomer(customer)}
          >
            Edit
          </button>
          <button
            className="delete-button"
            type="button"
            onClick={() => onDeleteCustomer(customer.id)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default CustomerRow;
