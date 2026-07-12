import { useState } from "react";

import Products from "./pages/Products";
import StockHistory from "./pages/StockHistory";
import Customers from "./pages/Customers";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("products");
  const [stockHistoryProductId, setStockHistoryProductId] = useState(null);

  function openProductStockHistory(productId) {
    setStockHistoryProductId(productId);
    setCurrentPage("stock-history");
  }

  function openAllStockHistory() {
    setStockHistoryProductId(null);
    setCurrentPage("stock-history");
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <span className="app-brand-mark" aria-hidden="true">A</span>

            <div>
              <strong>Accounting</strong>
              <span>Inventory workspace</span>
            </div>
          </div>

          <nav className="app-nav" aria-label="Main navigation">
            <button
              type="button"
              className={currentPage === "products" ? "active" : ""}
              onClick={() => setCurrentPage("products")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
                <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
              </svg>
              Products
            </button>

            <button
              type="button"
              className={currentPage === "stock-history" ? "active" : ""}
              onClick={openAllStockHistory}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5M12 7v5l3 2" />
              </svg>
              Stock History
            </button>

            <button
              type="button"
              className={currentPage === "customers" ? "active" : ""}
              onClick={() => setCurrentPage("customers")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Customers
            </button>
          </nav>
        </div>
      </header>

      {currentPage === "products" ? (
        <Products
          onOpenStockHistory={openProductStockHistory}
        />
      ) : currentPage === "stock-history" ? (
        <StockHistory
          initialProductId={stockHistoryProductId}
        />
      ) : (
        <Customers />
      )}
    </>
  );
}

export default App;
