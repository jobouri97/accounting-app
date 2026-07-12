import { useCallback, useEffect, useState } from "react";

import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../api/customers";
import CustomerForm from "../components/CustomerForm";
import CustomerTable from "../components/CustomerTable";
import SearchBox from "../components/SearchBox";
import "./Products.css";

const initialPagination = {
  page: 1,
  pageSize: 100,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const loadCustomers = useCallback(async (page, search = "") => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getCustomers(page, search);
      setCustomers(response.data.customers);
      setPagination(response.data.pagination);
    } catch (requestError) {
      console.error("Error loading customers:", requestError);
      setError(
        requestError.response?.data?.message ||
          "An error occurred while loading customers."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadCustomers(currentPage, debouncedSearch);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentPage, debouncedSearch, loadCustomers]);

  async function handleAddCustomer(customerData) {
    try {
      await createCustomer(customerData);

      if (currentPage === 1) {
        await loadCustomers(1, debouncedSearch);
      } else {
        setCurrentPage(1);
      }

      return { success: true };
    } catch (requestError) {
      return {
        success: false,
        message:
          requestError.response?.data?.message ||
          "An error occurred while adding the customer.",
      };
    }
  }

  async function handleUpdateCustomer(customerId, customerData) {
    try {
      const response = await updateCustomer(customerId, customerData);

      setCustomers((previousCustomers) =>
        previousCustomers.map((customer) =>
          customer.id === customerId ? response.data : customer
        )
      );
      setEditingCustomer(null);

      return { success: true };
    } catch (requestError) {
      return {
        success: false,
        message:
          requestError.response?.data?.message ||
          "An error occurred while updating the customer.",
      };
    }
  }

  async function handleDeleteCustomer(customerId) {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      setError("");
      await deleteCustomer(customerId);

      if (editingCustomer?.id === customerId) {
        setEditingCustomer(null);
      }

      const nextPage =
        customers.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      if (nextPage === currentPage) {
        await loadCustomers(currentPage, debouncedSearch);
      } else {
        setCurrentPage(nextPage);
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "An error occurred while deleting the customer."
      );
    }
  }

  function handleEditCustomer(customer) {
    setEditingCustomer(customer);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePageChange(page) {
    if (
      page < 1 ||
      page > pagination.totalPages ||
      page === currentPage ||
      isLoading
    ) {
      return;
    }

    setCurrentPage(page);
  }

  return (
    <main className="products-page">
      <div className="products-container">
        <header className="products-header">
          <div>
            <p className="products-subtitle">Accounts Management</p>
            <h1>Customers</h1>
          </div>
          <div className="products-count">
            <span>Total Customers</span>
            <strong>{pagination.totalItems}</strong>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <CustomerForm
          key={editingCustomer?.id ?? "new-customer"}
          onAddCustomer={handleAddCustomer}
          editingCustomer={editingCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onCancelEdit={() => setEditingCustomer(null)}
        />

        <SearchBox
          onSearch={setDebouncedSearch}
          onPageReset={setCurrentPage}
          label="Search Customers"
          placeholder="Search by name or phone"
          maxLength={150}
        />

        {isLoading ? (
          <div className="products-status">Loading customers...</div>
        ) : (
          <CustomerTable
            customers={customers}
            pagination={pagination}
            hasSearch={Boolean(debouncedSearch)}
            onPageChange={handlePageChange}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}
      </div>
    </main>
  );
}

export default Customers;
