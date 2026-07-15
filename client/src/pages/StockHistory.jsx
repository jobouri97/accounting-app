import { useCallback, useEffect, useState } from "react";

import { getProducts } from "../api/products";

import {
    createStockHistory,
    getStockHistory,
} from "../api/stockHistory";

import StockHistoryForm from "../components/StockHistoryForm";
import Pagination from "../components/Pagination";
import TableStatus from "../components/TableStatus";

import "./StockHistory.css";

const initialPagination = {
    page: 1,
    pageSize: 100,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
};

function StockHistory({ initialProductId = null }) {
    const [history, setHistory] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState(initialProductId);

    const loadHistory = useCallback(
        async (page, productId = null) => {
            try {
                setIsLoading(true);
                setError("");

                const response = await getStockHistory(
                    page,
                    productId
                );

                setHistory(response.data.stockHistory);
                setPagination(response.data.pagination);
            } catch (error) {
                console.error("Error loading stock history:", error);

                setError(
                    error.response?.data?.message ||
                    "An error occurred while loading stock history."
                );
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            loadHistory(currentPage, selectedProductId);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [currentPage, selectedProductId, loadHistory]);

    const loadProducts = useCallback(async () => {
        try {
            const firstResponse = await getProducts(1, "");
            const allProducts = [...firstResponse.data.products];

            for (
                let page = 2;
                page <= firstResponse.data.pagination.totalPages;
                page += 1
            ) {
                const response = await getProducts(page, "");
                allProducts.push(...response.data.products);
            }

            setProducts(allProducts);
        } catch (error) {
            console.error("Error loading products:", error);

            setError(
                error.response?.data?.message ||
                "An error occurred while loading products."
            );
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => loadProducts(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadProducts]);

    async function handleAddStock(stockData) {
        try {
            setError("");

            await createStockHistory(stockData);

            await loadProducts();

            if (currentPage === 1) {
                await loadHistory(1, selectedProductId);
            } else {
                setCurrentPage(1);
            }

            return {
                success: true,
            };
        } catch (error) {
            console.error("Error creating stock adjustment:", error);

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "An error occurred while saving the adjustment.",
            };
        }
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
        <main className="stock-history-page">
            <div className="stock-history-container">
                <header className="stock-history-header">
                    <div>
                        <p className="stock-history-subtitle">
                            Inventory Management
                        </p>

                        <h1>Stock History</h1>
                    </div>

                    <div className="stock-history-count">
                        <span>Total Records</span>
                        <strong>{pagination.totalItems}</strong>
                    </div>
                </header>

                {error && (
                    <div className="error-message dismissible-error" role="alert">
                        <span>{error}</span>

                        <button
                            type="button"
                            className="error-message-close"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                            title="Dismiss"
                        >
                            &times;
                        </button>
                    </div>
                )}

                <StockHistoryForm
                    products={products}
                    onAddStock={handleAddStock}
                    lockedProductId={initialProductId}
                    onProductChange={setSelectedProductId}
                />

                {isLoading ? (
                    <TableStatus>Loading stock history...</TableStatus>
                ) : history.length === 0 ? (
                    <div>No stock history records found.</div>
                ) : (
                    <section className="stock-history-table-card">
                        <div className="stock-history-table-wrapper">
                            <table className="stock-history-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Description</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {history.map((record) => (
                                        <tr key={record.id}>
                                            <td>{record.id}</td>
                                            <td>{record.product_name}</td>
                                            <td
                                                className={`stock-history-quantity ${record.quantity > 0 ? "positive" : "negative"
                                                    }`}
                                            >
                                                {record.quantity > 0
                                                    ? `+${record.quantity}`
                                                    : record.quantity}
                                            </td>
                                            <td>{record.description || "-"}</td>
                                            <td>
                                                {new Date(
                                                    record.created_at
                                                ).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            itemLabel="stock records"
                        />
                    </section>
                )}
            </div>
        </main>
    );
}

export default StockHistory;
