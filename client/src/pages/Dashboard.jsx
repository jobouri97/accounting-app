import { useCallback, useEffect, useMemo, useState } from "react";

import { getDashboard } from "../api/dashboard";
import "./Dashboard.css";

const emptyDashboard = {
  summary: {},
  salesTrend: [],
  recentInvoices: [],
  lowStock: [],
  topProducts: [],
};

function Icon({ name }) {
  const paths = {
    sales: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /></>,
    profit: <><path d="m4 16 5-5 4 4 7-8" /><path d="M15 7h5v5" /></>,
    products: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
    customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
    invoice: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    alert: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function Dashboard({ account, onNavigate }) {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getDashboard();
      setDashboard(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadDashboard(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  const summary = dashboard.summary;
  const maxSales = Math.max(
    ...dashboard.salesTrend.map((month) => Number(month.sales)),
    1
  );
  const chartPoints = useMemo(() => {
    if (!dashboard.salesTrend.length) return "";
    return dashboard.salesTrend
      .map((month, index) => {
        const x = dashboard.salesTrend.length === 1
          ? 50
          : (index / (dashboard.salesTrend.length - 1)) * 100;
        const y = 92 - (Number(month.sales) / maxSales) * 78;
        return `${x},${y}`;
      })
      .join(" ");
  }, [dashboard.salesTrend, maxSales]);

  const stats = [
    {
      label: "Sales this month",
      value: formatMoney(summary.month_sales),
      detail: `${summary.invoice_count || 0} lifetime invoices`,
      icon: "sales",
      tone: "blue",
    },
    {
      label: "Profit this month",
      value: formatMoney(summary.month_profit),
      detail: "Gross profit from sold items",
      icon: "profit",
      tone: "green",
    },
    {
      label: "Inventory value",
      value: formatMoney(summary.inventory_value),
      detail: `${summary.product_count || 0} products in catalog`,
      icon: "products",
      tone: "purple",
    },
    {
      label: "Receivables",
      value: formatMoney(summary.receivables),
      detail: `${summary.customer_count || 0} active customers`,
      icon: "customers",
      tone: "orange",
    },
  ];

  if (isLoading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          <span className="dashboard-loader" />
          <strong>Preparing your overview</strong>
          <p>Pulling together sales, inventory, and customers.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-error">
          <Icon name="alert" />
          <h2>We couldn’t load the dashboard</h2>
          <p>{error}</p>
          <button type="button" onClick={loadDashboard}><Icon name="refresh" />Try again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-welcome">
          <div>
            <p className="dashboard-kicker">Business overview</p>
            <h1>Welcome back, {account.name?.split(" ")[0] || "there"}</h1>
            <p>Here’s what’s happening with your business today.</p>
          </div>
          <button type="button" className="dashboard-primary-action" onClick={() => onNavigate("invoices")}>
            <Icon name="plus" />
            New invoice
          </button>
        </header>

        <section className="dashboard-stats" aria-label="Business summary">
          {stats.map((stat) => (
            <article className={`dashboard-stat dashboard-stat-${stat.tone}`} key={stat.label}>
              <div className="dashboard-stat-icon"><Icon name={stat.icon} /></div>
              <div className="dashboard-stat-copy">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.detail}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-main-grid">
          <article className="dashboard-card dashboard-sales-card">
            <div className="dashboard-card-heading">
              <div>
                <span>Performance</span>
                <h2>Sales overview</h2>
              </div>
              <div className="dashboard-total-sales">
                <span>All-time sales</span>
                <strong>{formatMoney(summary.total_sales)}</strong>
              </div>
            </div>

            <div className="dashboard-chart" aria-label="Sales over the last six months">
              <div className="dashboard-chart-lines" aria-hidden="true"><i /><i /><i /><i /></div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity=".25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {chartPoints && <polygon points={`0,100 ${chartPoints} 100,100`} fill="url(#salesArea)" />}
                {chartPoints && <polyline points={chartPoints} fill="none" stroke="#2563eb" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />}
              </svg>
              <div className="dashboard-chart-labels">
                {dashboard.salesTrend.map((month) => <span key={month.label}>{month.label}</span>)}
              </div>
            </div>
          </article>

          <article className="dashboard-card dashboard-stock-card">
            <div className="dashboard-card-heading">
              <div>
                <span>Inventory</span>
                <h2>Stock health</h2>
              </div>
              <button type="button" className="dashboard-link-button" onClick={() => onNavigate("products")}>
                View all <Icon name="arrow" />
              </button>
            </div>

            <div className="dashboard-stock-summary">
              <div className="dashboard-stock-ring" style={{ "--stock-risk": `${Math.min((Number(summary.low_stock_count) / Math.max(Number(summary.product_count), 1)) * 100, 100)}%` }}>
                <span><strong>{summary.product_count || 0}</strong><small>products</small></span>
              </div>
              <div>
                <strong>{summary.low_stock_count || 0} need attention</strong>
                <p>Products with 5 units or fewer remaining.</p>
              </div>
            </div>

            <div className="dashboard-stock-list">
              {dashboard.lowStock.length === 0 ? (
                <p className="dashboard-empty-state">Great work — all products are well stocked.</p>
              ) : dashboard.lowStock.map((product) => (
                <div key={product.id}>
                  <span className="dashboard-product-avatar">{product.name.charAt(0).toUpperCase()}</span>
                  <strong>{product.name}</strong>
                  <span className={Number(product.stock_quantity) === 0 ? "out" : "low"}>
                    {Number(product.stock_quantity) === 0 ? "Out of stock" : `${product.stock_quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-bottom-grid">
          <article className="dashboard-card dashboard-invoices-card">
            <div className="dashboard-card-heading">
              <div>
                <span>Latest activity</span>
                <h2>Recent invoices</h2>
              </div>
              <button type="button" className="dashboard-link-button" onClick={() => onNavigate("invoices")}>
                View all <Icon name="arrow" />
              </button>
            </div>

            {dashboard.recentInvoices.length === 0 ? (
              <div className="dashboard-empty-state dashboard-empty-large">
                <Icon name="invoice" />
                <strong>No invoices yet</strong>
                <p>Create your first invoice to see sales activity here.</p>
              </div>
            ) : (
              <div className="dashboard-invoice-list">
                {dashboard.recentInvoices.map((invoice) => (
                  <button type="button" key={invoice.id} onClick={() => onNavigate("invoices")}>
                    <span className="dashboard-invoice-icon"><Icon name="invoice" /></span>
                    <span className="dashboard-invoice-name">
                      <strong>{invoice.customer_name}</strong>
                      <small>Invoice #{invoice.id} · {invoice.item_count} {invoice.item_count === 1 ? "item" : "items"}</small>
                    </span>
                    <span className="dashboard-invoice-date">{formatDate(invoice.created_at)}</span>
                    <strong className="dashboard-invoice-total">{formatMoney(invoice.total)}</strong>
                    <Icon name="arrow" />
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="dashboard-card dashboard-products-card">
            <div className="dashboard-card-heading">
              <div>
                <span>Sales leaders</span>
                <h2>Top products</h2>
              </div>
            </div>
            {dashboard.topProducts.length === 0 ? (
              <p className="dashboard-empty-state">Product rankings will appear after your first sale.</p>
            ) : (
              <div className="dashboard-ranking-list">
                {dashboard.topProducts.map((product, index) => (
                  <div key={product.id}>
                    <span className="dashboard-rank">{index + 1}</span>
                    <span>
                      <strong>{product.name}</strong>
                      <small>{product.units_sold} units sold</small>
                    </span>
                    <strong>{formatMoney(product.revenue)}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
