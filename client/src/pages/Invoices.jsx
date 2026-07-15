import { useCallback, useEffect, useState } from "react";

import { getCustomers } from "../api/customers";
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  getInvoices,
  updateInvoice,
} from "../api/invoices";
import { getProducts } from "../api/products";
import DismissibleError from "../components/DismissibleError";
import InvoiceForm from "../components/InvoiceForm";
import Pagination from "../components/Pagination";
import TableStatus from "../components/TableStatus";
import { openInvoicePrintView } from "../utils/invoicePrint";
import "./Invoices.css";

const initialPagination = {
  page: 1,
  pageSize: 100,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

async function loadAllPages(requestPage, dataKey) {
  const firstResponse = await requestPage(1);
  const records = [...firstResponse.data[dataKey]];

  for (let page = 2; page <= firstResponse.data.pagination.totalPages; page += 1) {
    const response = await requestPage(page);
    records.push(...response.data[dataKey]);
  }

  return records;
}

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState("");
  const [customerFilterSearch, setCustomerFilterSearch] = useState("");
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState("");
  const [isCustomerFilterOpen, setIsCustomerFilterOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [printingInvoiceId, setPrintingInvoiceId] = useState(null);
  const [error, setError] = useState("");

  const loadInvoices = useCallback(async (page, customerId = "", invoiceId = "") => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getInvoices(
        page,
        customerId || null,
        invoiceId || null
      );
      setInvoices(response.data.invoices);
      setPagination(response.data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadReferenceData = useCallback(async () => {
    try {
      const [allCustomers, allProducts] = await Promise.all([
        loadAllPages((page) => getCustomers(page, ""), "customers"),
        loadAllPages((page) => getProducts(page, ""), "products"),
      ]);
      setCustomers(allCustomers);
      setProducts(allProducts);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load customers and products.");
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadInvoices(currentPage, customerFilter, invoiceNumberFilter);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentPage, customerFilter, invoiceNumberFilter, loadInvoices]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadReferenceData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadReferenceData]);

  async function handleSave(invoiceData) {
    try {
      setError("");
      if (editingInvoice) {
        await updateInvoice(editingInvoice.invoice.id, invoiceData);
        setEditingInvoice(null);
      } else {
        await createInvoice(invoiceData);
      }

      await Promise.all([
        loadReferenceData(),
        loadInvoices(
          editingInvoice ? currentPage : 1,
          customerFilter,
          invoiceNumberFilter
        ),
      ]);

      if (!editingInvoice && currentPage !== 1) setCurrentPage(1);
      return { success: true };
    } catch (requestError) {
      return {
        success: false,
        message: requestError.response?.data?.message || "Unable to save the invoice.",
      };
    }
  }

  async function handleEdit(invoiceId) {
    try {
      setEditingInvoiceId(invoiceId);
      setError("");
      const response = await getInvoice(invoiceId);
      setEditingInvoice(response.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load the invoice.");
    } finally {
      setEditingInvoiceId(null);
    }
  }

  async function handleOpenPdf(invoiceId) {
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      setError("Please allow pop-ups to open the invoice PDF.");
      return;
    }

    printWindow.document.write("<title>Loading invoice...</title><p>Loading invoice...</p>");

    try {
      setPrintingInvoiceId(invoiceId);
      setError("");
      const response = await getInvoice(invoiceId);
      openInvoicePrintView(response.data, printWindow);
    } catch (requestError) {
      printWindow.close();
      setError(requestError.response?.data?.message || "Unable to open the invoice PDF.");
    } finally {
      setPrintingInvoiceId(null);
    }
  }

  async function handleDelete(invoiceId) {
    if (!window.confirm(`Delete invoice #${invoiceId}? Product stock will be restored.`)) return;

    try {
      setError("");
      await deleteInvoice(invoiceId);
      if (editingInvoice?.invoice.id === invoiceId) setEditingInvoice(null);

      const nextPage = invoices.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;

      await loadReferenceData();
      if (nextPage === currentPage) {
        await loadInvoices(currentPage, customerFilter, invoiceNumberFilter);
      } else {
        setCurrentPage(nextPage);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete the invoice.");
    }
  }

  function handleFilterSearch(event) {
    setCustomerFilterSearch(event.target.value);
    setCustomerFilter("");
    setIsCustomerFilterOpen(true);
    setCurrentPage(1);
  }

  function handleFilterSelect(customer) {
    setCustomerFilter(customer?.id ?? "");
    setCustomerFilterSearch(customer?.customer_name ?? "");
    setIsCustomerFilterOpen(false);
    setCurrentPage(1);
  }

  function handleInvoiceNumberFilter(event) {
    setInvoiceNumberFilter(event.target.value.replace(/\D/g, ""));
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > pagination.totalPages || page === currentPage || isLoading) return;
    setCurrentPage(page);
  }

  const selectedFilterCustomer = customers.find(
    (customer) => customer.id === Number(customerFilter)
  );
  const filteredFilterCustomers =
    selectedFilterCustomer?.customer_name === customerFilterSearch
      ? customers
      : customers.filter((customer) =>
        customer.customer_name
          .toLowerCase()
          .includes(customerFilterSearch.trim().toLowerCase())
      );

  return (
    <main className="invoices-page">
      <div className="invoices-container">
        <header className="invoices-header">
          <div>
            <p className="invoices-subtitle">Sales Management</p>
            <h1>Invoices</h1>
          </div>
          <div className="invoices-count">
            <span>Total Invoices</span>
            <strong>{pagination.totalItems}</strong>
          </div>
        </header>

        <DismissibleError message={error} onDismiss={() => setError("")} />

        <InvoiceForm
          key={editingInvoice ? `edit-${editingInvoice.invoice.id}` : "new-invoice"}
          customers={customers}
          products={products}
          editingInvoice={editingInvoice}
          onSave={handleSave}
          onCancelEdit={() => setEditingInvoice(null)}
        />

        <section className="invoice-list-card">
          <div className="invoice-list-toolbar">
            <div>
              <h2>Invoice History</h2>
              <p>Review, edit, or remove completed invoices.</p>
            </div>
            <div className="invoice-list-filters">
              <label className="invoice-number-filter">
                <span>Invoice #</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={invoiceNumberFilter}
                  placeholder="Search number"
                  aria-label="Filter by invoice number"
                  onChange={handleInvoiceNumberFilter}
                />
              </label>

              <div className="invoice-list-filter">
                <span>Customer</span>
                <div className="invoice-filter-combobox">
                <input
                  role="combobox"
                  autoComplete="off"
                  aria-label="Filter invoices by customer"
                  aria-expanded={isCustomerFilterOpen}
                  aria-controls="invoice-filter-customer-options"
                  value={customerFilterSearch}
                  placeholder="Search customers"
                  onChange={handleFilterSearch}
                  onFocus={() => setIsCustomerFilterOpen(true)}
                  onClick={() => setIsCustomerFilterOpen(true)}
                  onBlur={() => window.setTimeout(() => setIsCustomerFilterOpen(false), 150)}
                />
                <span className="invoice-combobox-arrow" aria-hidden="true">⌄</span>

                {isCustomerFilterOpen && (
                  <div
                    id="invoice-filter-customer-options"
                    className="invoice-customer-options"
                    role="listbox"
                  >
                    <button
                      type="button"
                      className="invoice-customer-option"
                      role="option"
                      aria-selected={!customerFilter}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleFilterSelect(null);
                      }}
                    >
                      <span><strong>All customers</strong><small>Show every invoice</small></span>
                    </button>

                    {filteredFilterCustomers.length === 0 ? (
                      <div className="invoice-customer-empty">No customers found</div>
                    ) : filteredFilterCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="invoice-customer-option"
                        role="option"
                        aria-selected={Number(customerFilter) === customer.id}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleFilterSelect(customer);
                        }}
                      >
                        <span><strong>{customer.customer_name}</strong><small>ID: {customer.id}</small></span>
                      </button>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <TableStatus>Loading invoices...</TableStatus>
          ) : invoices.length === 0 ? (
            <div className="invoices-empty">
              <span aria-hidden="true">#</span>
              <h3>No invoices yet</h3>
              <p>Create your first invoice using the form above.</p>
            </div>
          ) : (
            <>
              <div className="invoices-table-wrapper">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td><span className="invoice-number">#{invoice.id}</span></td>
                        <td>
                          <strong>{invoice.customer_name || "Passer Customer"}</strong>
                          {!invoice.customer_id && <span className="passer-badge">Walk-in</span>}
                        </td>
                        <td>{invoice.item_count}</td>
                        <td className="invoice-total-cell">{Number(invoice.total).toFixed(2)}</td>
                        <td>{new Date(invoice.created_at).toLocaleString()}</td>
                        <td>
                          <div className="invoice-actions">
                            <button
                              type="button"
                              className="invoice-pdf-button"
                              disabled={printingInvoiceId === invoice.id}
                              onClick={() => handleOpenPdf(invoice.id)}
                            >
                              {printingInvoiceId === invoice.id ? "Opening..." : "PDF"}
                            </button>
                            <button
                              type="button"
                              className="invoice-edit-button"
                              disabled={editingInvoiceId === invoice.id}
                              onClick={() => handleEdit(invoice.id)}
                            >
                              {editingInvoiceId === invoice.id ? "Loading..." : "Edit"}
                            </button>
                            <button
                              type="button"
                              className="invoice-delete-button"
                              onClick={() => handleDelete(invoice.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={pagination} onPageChange={handlePageChange} itemLabel="invoices" />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Invoices;
