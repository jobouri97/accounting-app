import { useCallback, useEffect, useState } from "react";

import { getCustomers } from "../api/customers";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "../api/transactions";
import Pagination from "../components/Pagination";
import TransactionForm from "../components/TransactionForm";
import "./Transactions.css";

const initialPagination = {
  page: 1,
  pageSize: 100,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function Transactions({ initialCustomerId = null }) {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const loadTransactions = useCallback(async (page, customerId) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getTransactions(page, customerId);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "An error occurred while loading transactions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const firstResponse = await getCustomers(1, "");
      const allCustomers = [...firstResponse.data.customers];
      const totalPages = firstResponse.data.pagination.totalPages;

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await getCustomers(page, "");
        allCustomers.push(...response.data.customers);
      }

      setCustomers(allCustomers);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "An error occurred while loading customers.");
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadTransactions(currentPage, selectedCustomerId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentPage, selectedCustomerId, loadTransactions]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadCustomers(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCustomers]);

  async function handleAddTransaction(transactionData) {
    try {
      setError("");
      await createTransaction(transactionData);
      await loadCustomers();

      if (currentPage === 1) {
        await loadTransactions(1, selectedCustomerId);
      } else {
        setCurrentPage(1);
      }

      return { success: true };
    } catch (requestError) {
      return {
        success: false,
        message: requestError.response?.data?.message || "An error occurred while saving the transaction.",
      };
    }
  }

  async function handleUpdateTransaction(transactionId, transactionData) {
    try {
      setError("");
      await updateTransaction(transactionId, transactionData);
      await Promise.all([
        loadCustomers(),
        loadTransactions(currentPage, selectedCustomerId),
      ]);
      setEditingTransaction(null);
      return { success: true };
    } catch (requestError) {
      return {
        success: false,
        message: requestError.response?.data?.message || "An error occurred while updating the transaction.",
      };
    }
  }

  async function handleDeleteTransaction(transactionId) {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    try {
      setError("");
      await deleteTransaction(transactionId);

      if (editingTransaction?.id === transactionId) {
        setEditingTransaction(null);
      }

      await loadCustomers();
      const nextPage = transactions.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;

      if (nextPage === currentPage) {
        await loadTransactions(currentPage, selectedCustomerId);
      } else {
        setCurrentPage(nextPage);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "An error occurred while deleting the transaction.");
    }
  }

  function handleEditTransaction(transaction) {
    setEditingTransaction(transaction);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePageChange(page) {
    if (page < 1 || page > pagination.totalPages || page === currentPage || isLoading) return;
    setCurrentPage(page);
  }

  const selectedCustomer = customers.find(
    (customer) => customer.id === Number(selectedCustomerId)
  );

  return (
    <main className="transactions-page">
      <div className="transactions-container">
        <header className="transactions-header">
          <div>
            <p className="transactions-subtitle">Accounts Management</p>
            <h1>{selectedCustomer ? `${selectedCustomer.customer_name} Transactions` : "Transactions"}</h1>
          </div>
          <div className="transactions-count">
            <span>Total Records</span>
            <strong>{pagination.totalItems}</strong>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <TransactionForm
          key={editingTransaction
            ? `edit-${editingTransaction.id}`
            : initialCustomerId
              ? `customer-${initialCustomerId}`
              : "new-transaction"}
          customers={customers}
          lockedCustomerId={initialCustomerId}
          onAddTransaction={handleAddTransaction}
          editingTransaction={editingTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onCancelEdit={() => setEditingTransaction(null)}
          onCustomerChange={setSelectedCustomerId}
        />

        {isLoading ? (
          <div className="transactions-status">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="transactions-status">No transactions found.</div>
        ) : (
          <section className="transactions-table-card">
            <div className="transactions-table-wrapper">
              <table className="transactions-table">
                <thead><tr><th>#</th><th>Customer</th><th>Debit</th><th>Credit</th><th>Balance</th><th>Note</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id}>
                      <td>{pagination.totalItems - (currentPage - 1) * pagination.pageSize - index}</td>
                      <td>{transaction.customer_name}</td>
                      <td className="transaction-debit">{Number(transaction.debit) > 0 ? `${Number(transaction.debit).toFixed(2)}` : "—"}</td>
                      <td className="transaction-credit">{Number(transaction.credit) > 0 ? `${Number(transaction.credit).toFixed(2)}` : "—"}</td>
                      <td className={Number(transaction.balance) > 0 ? "transaction-balance positive" : Number(transaction.balance) < 0 ? "transaction-balance negative" : "transaction-balance"}>
                        {Number(transaction.balance).toFixed(2)}
                      </td>
                      <td>{transaction.note || "—"}</td>
                      <td>{new Date(transaction.created_at).toLocaleString()}</td>
                      <td>
                        {transaction.invoice_id ? (
                          <span className="invoice-managed-transaction">
                            Invoice #{transaction.invoice_id}
                          </span>
                        ) : (
                          <div className="transaction-actions">
                            <button type="button" className="transaction-edit-button" onClick={() => handleEditTransaction(transaction)}>
                              Edit
                            </button>
                            <button type="button" className="transaction-delete-button" onClick={() => handleDeleteTransaction(transaction.id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={handlePageChange} itemLabel="transactions" />
          </section>
        )}
      </div>
    </main>
  );
}

export default Transactions;
