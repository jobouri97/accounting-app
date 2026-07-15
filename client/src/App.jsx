import { useEffect, useState } from "react";

import { getCurrentAccount, logoutAccount } from "./api/auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import StockHistory from "./pages/StockHistory";
import Customers from "./pages/Customers";
import Transactions from "./pages/Transactions";
import Invoices from "./pages/Invoices";
import Profits from "./pages/Profits";
import Auth from "./pages/Auth";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [stockHistoryProductId, setStockHistoryProductId] = useState(null);
  const [transactionCustomerId, setTransactionCustomerId] = useState(null);

  useEffect(() => {
    let isActive = true;

    getCurrentAccount()
      .then((response) => {
        if (isActive) setAccount(response.data.user);
      })
      .catch(() => {
        if (isActive) setAccount(null);
      })
      .finally(() => {
        if (isActive) setIsCheckingAccount(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logoutAccount();
      setAccount(null);
      setCurrentPage("dashboard");
    } finally {
      setIsLoggingOut(false);
    }
  }

  function openProductStockHistory(productId) {
    setStockHistoryProductId(productId);
    setCurrentPage("stock-history");
  }

  function openAllStockHistory() {
    setStockHistoryProductId(null);
    setCurrentPage("stock-history");
  }

  function openCustomerTransactions(customerId) {
    setTransactionCustomerId(customerId);
    setCurrentPage("transactions");
  }

  function openAllTransactions() {
    setTransactionCustomerId(null);
    setCurrentPage("transactions");
  }

  if (isCheckingAccount) {
    return (
      <main className="app-loading-screen">
        <span className="app-brand-mark" aria-hidden="true">A</span>
        <p>Loading your workspace...</p>
      </main>
    );
  }

  if (!account) {
    return <Auth onAuthenticated={setAccount} />;
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <button
            type="button"
            className="app-brand"
            aria-label="Open dashboard"
            onClick={() => setCurrentPage("dashboard")}
          >
            <span className="app-brand-mark" aria-hidden="true">A</span>

            <div>
              <strong>Accounting</strong>
              <span>{account.name}</span>
            </div>
          </button>

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

            <button
              type="button"
              className={currentPage === "invoices" ? "active" : ""}
              onClick={() => setCurrentPage("invoices")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                <path d="M9 8h6M9 12h6M9 16h3" />
              </svg>
              Invoices
            </button>

            <button
              type="button"
              className={currentPage === "transactions" ? "active" : ""}
              onClick={openAllTransactions}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h10" />
                <path d="m17 16 3 2-3 2" />
              </svg>
              Transactions
            </button>

            <button
              type="button"
              className={currentPage === "profits" ? "active" : ""}
              onClick={() => setCurrentPage("profits")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />
              </svg>
              Profit
            </button>

            <button
              type="button"
              className="app-logout-button"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" />
              </svg>
              {isLoggingOut ? "Leaving..." : "Logout"}
            </button>
          </nav>
        </div>
      </header>

      {currentPage === "dashboard" ? (
        <Dashboard account={account} onNavigate={setCurrentPage} />
      ) : currentPage === "products" ? (
        <Products
          onOpenStockHistory={openProductStockHistory}
        />
      ) : currentPage === "stock-history" ? (
        <StockHistory
          initialProductId={stockHistoryProductId}
        />
      ) : currentPage === "customers" ? (
        <Customers onOpenTransactions={openCustomerTransactions} />
      ) : currentPage === "invoices" ? (
        <Invoices />
      ) : currentPage === "profits" ? (
        <Profits />
      ) : (
        <Transactions
          key={transactionCustomerId ?? "all-transactions"}
          initialCustomerId={transactionCustomerId}
        />
      )}
    </>
  );
}

export default App;
