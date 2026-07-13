import CustomerRow from "./CustomerRow";
import Pagination from "./Pagination";
import "./ProductTable.css";

function CustomerTable({
  customers,
  pagination,
  hasSearch,
  onPageChange,
  onEditCustomer,
  onDeleteCustomer,
  onOpenTransactions,
}) {
  if (customers.length === 0) {
    return (
      <section className="empty-products">
        <h2>{hasSearch ? "No Matching Customers" : "No Customers Found"}</h2>
        <p>
          {hasSearch
            ? "Try searching by another name or phone number."
            : "Add your first customer to display it here."}
        </p>
      </section>
    );
  }

  return (
    <section className="products-table-card">
      <div className="section-heading">
        <h2>Customer List</h2>
        <p>View, edit, or delete your customers.</p>
      </div>

      <div className="table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                onEditCustomer={onEditCustomer}
                onDeleteCustomer={onDeleteCustomer}
                onOpenTransactions={onOpenTransactions}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
        itemLabel="customers"
      />
    </section>
  );
}

export default CustomerTable;
