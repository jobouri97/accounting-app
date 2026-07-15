import { useCallback, useEffect, useState } from "react";

import { getProfits } from "../api/profits";
import DatePicker from "../components/DatePicker";
import Pagination from "../components/Pagination";
import TableStatus from "../components/TableStatus";
import "./Profits.css";

const initialPagination = {
  page: 1,
  pageSize: 100,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatMoney(value) {
  return Number(value).toFixed(2);
}

function Profits() {
  const [profits, setProfits] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [totalProfit, setTotalProfit] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadProfits = useCallback(async (page, fromDate, toDate) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getProfits(page, fromDate, toDate);
      setProfits(response.data.profits);
      setPagination(response.data.pagination);
      setTotalProfit(response.data.summary.totalProfit);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "An error occurred while loading profits."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => loadProfits(currentPage, startDate, endDate),
      0
    );
    return () => window.clearTimeout(timeoutId);
  }, [currentPage, startDate, endDate, loadProfits]);

  function handleStartDateChange(value) {
    setStartDate(value);
    setCurrentPage(1);
  }

  function handleEndDateChange(value) {
    setEndDate(value);
    setCurrentPage(1);
  }

  function clearDateFilter() {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
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
    <main className="profits-page">
      <div className="profits-container">
        <header className="profits-header">
          <div>
            <p className="profits-subtitle">Sales Performance</p>
            <h1>Profit</h1>
          </div>

          <div className="profits-summary">
            <div className="profits-count">
              <span>Total Records</span>
              <strong>{pagination.totalItems}</strong>
            </div>

            <div className="profits-count total-profit-card">
              <span>Total Profit</span>
              <strong>{formatMoney(totalProfit)}</strong>
            </div>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <section className="profits-filters" aria-label="Profit filters">
          <DatePicker
            label="From"
            value={startDate}
            max={endDate}
            onChange={handleStartDateChange}
          />

          <DatePicker
            label="To"
            value={endDate}
            min={startDate}
            onChange={handleEndDateChange}
          />

          <button
            type="button"
            className="profits-clear-dates"
            onClick={clearDateFilter}
            disabled={!startDate && !endDate}
          >
            Clear Dates
          </button>
        </section>

        {isLoading ? (
          <TableStatus>Loading profits...</TableStatus>
        ) : profits.length === 0 ? (
          <div className="profits-status">No profit records found.</div>
        ) : (
          <section className="profits-table-card">
            <div className="profits-table-wrapper">
              <table className="profits-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Purchase Price</th>
                    <th>Selling Price</th>
                    <th>Discount</th>
                    <th>Qty</th>
                    <th>Profit</th>
                    <th>Note</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {profits.map((record, index) => (
                    <tr key={record.id}>
                      <td>
                        {pagination.totalItems -
                          (currentPage - 1) * pagination.pageSize -
                          index}
                      </td>
                      <td>{record.product_name || "Unknown product"}</td>
                      <td>{formatMoney(record.purchase_price)}</td>
                      <td>{formatMoney(record.selling_price)}</td>
                      <td>{formatMoney(record.discount)}</td>
                      <td>{record.quantity}</td>
                      <td className="profit-value">{formatMoney(record.profit)}</td>
                      <td>
                        <span className="profit-invoice-note">
                          Invoice #{record.invoice_id}
                        </span>
                      </td>
                      <td>{new Date(record.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              itemLabel="profit records"
            />
          </section>
        )}
      </div>
    </main>
  );
}

export default Profits;
