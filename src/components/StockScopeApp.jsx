"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Globe2,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Star,
  TrendingUp,
  X,
  UserRound,
  LogOut,
  UserPlus,
  Palette,
  ShieldCheck,
} from "lucide-react";
import useLivePriceStore from "../store/livePriceStore";
import { initialStocks } from "../data/stocks.js";
import { fetchQuote } from "../services/stockApi.js";
import { useWatchlist } from "../hooks/useWatchlist.js";
import StockTable from "./StockTable.jsx";
import PriceChart from "./PriceChart.jsx";
import StockDetails from "./StockDetails.jsx";
import useStockWebSocket from "../hooks/useStockWebSocket.js";
import {
  FILTER_METRICS,
  matchesMetricFilters,
  toCsv,
} from "../utils/screener.js";
import CircularAnalytics from "./CircularAnalytics.jsx";
import CandlestickChart from "./CandlestickChart.jsx";
const API_KEY = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY || "";
const money = (stock) =>
  new Intl.NumberFormat(stock.market === "IN" ? "en-IN" : "en-US", {
    style: "currency",
    currency: stock.currency,
    maximumFractionDigits: 2,
  }).format(stock.price);

function StatCard({ label, value, hint, trend, icon: Icon }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={17} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        <span
          className={
            trend === "up"
              ? "text-positive"
              : trend === "down"
                ? "text-negative"
                : "muted-cell"
          }
        >
          {trend === "up" ? (
            <ArrowUpRight size={14} />
          ) : trend === "down" ? (
            <ArrowDownRight size={14} />
          ) : null}
          {hint}
        </span>
        <span className="stat-period">vs previous close</span>
      </div>
    </article>
  );
}

export default function App() {
  const [stocks, setStocks] = useState(initialStocks);
  const [market, setMarket] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [minChange, setMinChange] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [metricFilters, setMetricFilters] = useState({});
  const [sort, setSort] = useState({ key: "volume", direction: "desc" });
  const [selected, setSelected] = useState(null);
  const [chartSymbol, setChartSymbol] = useState(
    initialStocks[0]?.symbol || "",
  );
  const [activeView, setActiveView] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const [accountDialog, setAccountDialog] = useState("");
  const [accountName, setAccountName] = useState("Guest analyst");
  const [accountEmail, setAccountEmail] = useState("");
  const [theme, setTheme] = useState("violet");
  const [toast, setToast] = useState("");
  const { watchlist, toggle } = useWatchlist();
  const {
    prices: livePrices,
    status: wsStatus,
    lastMessageAt: wsLastMessageAt,
  } = useStockWebSocket();
  const sectors = useMemo(
    () =>
      [
        "All sectors",
        ...new Set(
          stocks
            .filter((s) => market === "ALL" || s.market === market)
            .map((s) => s.sector),
        ),
      ].sort((a, b) =>
        a === "All sectors" ? -1 : b === "All sectors" ? 1 : a.localeCompare(b),
      ),
    [stocks, market],
  );

  const marketStocks = useMemo(
    () =>
      stocks.filter((s) => {
        if (market !== "ALL" && s.market !== market) return false;
        if (activeView === "watchlist" && !watchlist.includes(s.symbol))
          return false;
        return true;
      }),
    [stocks, market, activeView, watchlist],
  );

  const filteredStocks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = marketStocks.filter((s) => {
      const matchesSearch =
        !q ||
        s.symbol.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q);
      const matchesSector = sector === "All sectors" || s.sector === sector;
      const matchesChange =
        minChange === "all" ||
        (minChange === "gainers"
          ? s.change > 0
          : minChange === "losers"
            ? s.change < 0
            : Math.abs(s.change) >= Number(minChange));
      const matchesMin = minPrice === "" || s.price >= Number(minPrice);
      const matchesMax = maxPrice === "" || s.price <= Number(maxPrice);
      return (
        matchesSearch &&
        matchesSector &&
        matchesChange &&
        matchesMin &&
        matchesMax &&
        matchesMetricFilters(s, metricFilters)
      );
    });
    return filtered.sort((a, b) => {
      const av = a[sort.key],
        bv = b[sort.key];
      const result =
        typeof av === "string"
          ? String(av).localeCompare(String(bv))
          : Number(av) - Number(bv);
      return sort.direction === "asc" ? result : -result;
    });
  }, [
    marketStocks,
    search,
    sector,
    minChange,
    minPrice,
    maxPrice,
    metricFilters,
    sort,
  ]);

  const chartStock =
    marketStocks.find((s) => s.symbol === chartSymbol) ||
    marketStocks[0] ||
    null;

  const chartMarket =
    chartStock?.market === "US" ||
    chartStock?.exchange === "NASDAQ" ||
    chartStock?.exchange === "NYSE"
      ? "US"
      : "IN";

  const livePriceKey = `${chartMarket}:${chartStock?.symbol}`;

  const selectedLivePrice = livePrices[livePriceKey]?.price;
  const topGainer = useMemo(
    () =>
      marketStocks.reduce(
        (best, stock) => (!best || stock.change > best.change ? stock : best),
        null,
      ),
    [marketStocks],
  );
  const avgChange = useMemo(
    () =>
      marketStocks.length
        ? marketStocks.reduce((sum, stock) => sum + stock.change, 0) /
          marketStocks.length
        : 0,
    [marketStocks],
  );
  const totalVolume = useMemo(
    () =>
      marketStocks.reduce((sum, stock) => sum + (Number(stock.volume) || 0), 0),
    [marketStocks],
  );
  const activeMetricCount = Object.values(metricFilters).filter(
    (bounds) =>
      bounds &&
      ((bounds.min !== "" && bounds.min != null) ||
        (bounds.max !== "" && bounds.max != null)),
  ).length;
  const activeFilterCount =
    (sector !== "All sectors" ? 1 : 0) +
    (minChange !== "all" ? 1 : 0) +
    (minPrice !== "" ? 1 : 0) +
    (maxPrice !== "" ? 1 : 0) +
    activeMetricCount;

  const exportCsv = () => {
    const csv = toCsv(filteredStocks);
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `stockscope-screen-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setToast(
      `Exported ${filteredStocks.length.toLocaleString()} screened rows to CSV.`,
    );
  };

  const refreshData = async () => {
    if (!API_KEY) {
      setNotice(
        "Demo mode: add VITE_TWELVE_DATA_API_KEY to .env.local to enable provider quote refresh. Demo values are not live.",
      );
      return;
    }
    setRefreshing(true);
    setNotice("");
    try {
      // Refresh a small visible universe to reduce provider credit usage. Check your plan's limits.
      const targets = marketStocks.slice(0, 6);
      const results = await Promise.allSettled(
        targets.map((s) => fetchQuote(s, API_KEY)),
      );
      let successCount = 0;
      setStocks((current) =>
        current.map((stock) => {
          const index = targets.findIndex(
            (t) => t.symbol === stock.symbol && t.market === stock.market,
          );
          if (index < 0 || results[index].status !== "fulfilled") return stock;
          successCount++;
          return results[index].value;
        }),
      );
      setLastUpdated(new Date());
      const failures = results.length - successCount;
      setNotice(
        successCount
          ? `Updated ${successCount} quote(s) from Twelve Data${failures ? `; ${failures} could not be refreshed` : ""}.`
          : "No quotes updated. Check API key, symbol coverage, provider limits and network.",
      );
    } catch {
      setNotice(
        "Unable to refresh quotes. Check your connection and API settings.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSector("All sectors");
    setMinChange("all");
    setMinPrice("");
    setMaxPrice("");
    setMetricFilters({});
  };
  const title =
    activeView === "watchlist"
      ? "Your watchlist"
      : activeView === "screener"
        ? "Stock screener"
        : activeView === "charts"
          ? "Stock charts"
          : "Market overview";

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Activity size={21} />
          </div>
          <span>
            stock<span className="brand-accent">scope</span>
            <small>MARKET INTELLIGENCE</small>
          </span>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <button
            className={`nav-item ${activeView === "overview" ? "active" : ""}`}
            onClick={() => {
              setActiveView("overview");
              setMobileNav(false);
            }}
          >
            <LayoutDashboard size={17} /> Overview
          </button>
          <button
            className={`nav-item ${activeView === "screener" ? "active" : ""}`}
            onClick={() => {
              setActiveView("screener");
              setMobileNav(false);
            }}
          >
            <SlidersHorizontal size={17} /> Stock screener{" "}
            <span className="nav-count">{stocks.length}</span>
          </button>
          <button
            className={`nav-item ${activeView === "charts" ? "active" : ""}`}
            onClick={() => {
              setActiveView("charts");
              setMobileNav(false);
            }}
          >
            <Activity size={17} /> Stock charts
          </button>
          <button
            className={`nav-item ${activeView === "watchlist" ? "active" : ""}`}
            onClick={() => {
              setActiveView("watchlist");
              setMobileNav(false);
            }}
          >
            <Star size={17} /> Watchlist{" "}
            <span className="nav-count">{watchlist.length}</span>
          </button>
          <button
            className={`nav-item ${activeView === "settings" ? "active" : ""}`}
            onClick={() => {
              setActiveView("settings");
              setMobileNav(false);
            }}
          >
            <Settings2 size={17} /> Settings
          </button>
        </nav>
        <div className="sidebar-section-label markets-label">MARKETS</div>
        <div className="market-nav">
          <button
            className={`market-nav-item ${market === "IN" ? "selected" : ""}`}
            onClick={() => setMarket(market === "IN" ? "ALL" : "IN")}
          >
            <span className="flag">🇮🇳</span>
            <span>
              India <small>NSE / BSE</small>
            </span>
            <span className="market-dot" />
          </button>
          <button
            className={`market-nav-item ${market === "US" ? "selected" : ""}`}
            onClick={() => setMarket(market === "US" ? "ALL" : "US")}
          >
            <span className="flag">🇺🇸</span>
            <span>
              United States <small>NASDAQ / NYSE</small>
            </span>
            <span className="market-dot" />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-icon">
              <Globe2 size={16} />
            </div>
            <div>
              <strong>Multi-market workspace</strong>
              <p>India + US equities</p>
            </div>
            <ChevronDown size={14} />
          </div>
          <button
            className="profile-row profile-button"
            onClick={() => setAccountMenu((v) => !v)}
          >
            <div className="avatar">
              {accountName.slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-text">
              <strong>{accountName}</strong>
              <small>{accountEmail || "Frontend demo account"}</small>
            </div>
            <ChevronDown size={16} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobileNav(true)}
              aria-label="Open menu"
            >
              <Menu />
            </button>
            <div className="breadcrumb">
              Workspace <span>/</span> <strong>{title}</strong>
            </div>
          </div>
          <label className="global-search">
            <Search size={16} />
            <input
              aria-label="Search all stocks"
              placeholder="Search stocks, companies, or symbols…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (activeView === "overview") setActiveView("screener");
              }}
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="topbar-actions">
            <div
              className={`ws-status ws-${wsStatus}`}
              role="status"
              aria-live="polite"
              title={
                wsLastMessageAt
                  ? `Last message: ${new Date(wsLastMessageAt).toLocaleTimeString()}`
                  : "Waiting for the first price update"
              }
            >
              <span className="ws-status-dot" />
              <span>
                {wsStatus === "connected"
                  ? "WS Connected"
                  : wsStatus === "reconnecting"
                    ? "WS Reconnecting"
                    : wsStatus === "connecting"
                      ? "WS Connecting"
                      : "WS Disconnected"}
              </span>
              <small>Simulation</small>
            </div>
            <div className="market-status">
              <span className="status-dot" />
              {market === "IN"
                ? "India market"
                : market === "US"
                  ? "US market"
                  : "Multi-market"}{" "}
              <span className="status-muted">· Demo feed</span>
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <i />
            </button>
            <button
              className="top-avatar top-avatar-button"
              aria-label="Open account menu"
              onClick={() => setAccountMenu((v) => !v)}
            >
              {accountName.slice(0, 2).toUpperCase()}
            </button>
            {accountMenu && (
              <div className="account-popover">
                <div className="account-popover-head">
                  <div className="avatar">
                    {accountName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{accountName}</strong>
                    <small>{accountEmail || "Guest mode"}</small>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAccountDialog("create");
                    setAccountMenu(false);
                  }}
                >
                  <UserPlus size={15} /> Create account
                </button>
                <button
                  onClick={() => {
                    setActiveView("settings");
                    setAccountMenu(false);
                  }}
                >
                  <Settings2 size={15} /> Settings
                </button>
                <button
                  onClick={() => {
                    setAccountName("Guest analyst");
                    setAccountEmail("");
                    setToast("You are now signed out of this local demo.");
                    setAccountMenu(false);
                  }}
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> MARKET PULSE{" "}
                <span className="eyebrow-dot" />
              </div>
              <h1>
                {title}
                <span className="title-period">.</span>
              </h1>
              <p className="page-subtitle">
                Explore market momentum and compare equities across a
                5,000-record synthetic demo universe. Synthetic records are for
                performance testing, not live listings.
              </p>
            </div>
            <div className="welcome-actions">
              <button
                className="button button-secondary"
                onClick={() => setShowFilters((v) => !v)}
              >
                <SlidersHorizontal size={15} />
                {showFilters ? "Hide filters" : "Filters"}{" "}
                <span className="filter-count">{activeFilterCount}</span>
              </button>
              <button
                className="button button-primary"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw size={15} className={refreshing ? "spin" : ""} />
                {refreshing ? "Refreshing…" : "Refresh quotes"}
              </button>
            </div>
          </section>

          <section className="market-tabs" aria-label="Market selection">
            {[
              ["ALL", "All markets"],
              ["IN", "🇮🇳 India"],
              ["US", "🇺🇸 United States"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`market-tab ${market === id ? "active" : ""}`}
                onClick={() => setMarket(id)}
              >
                {label}
                {market === id && <span className="tab-underline" />}
              </button>
            ))}
            <div className="market-tabs-right">
              <Clock3 size={13} />
              <span>
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString()}`
                  : "Sample data loaded"}
              </span>
            </div>
          </section>

          {notice && (
            <div
              className={`notice ${notice.startsWith("Updated") ? "notice-success" : ""}`}
              role="status"
            >
              <CircleHelp size={16} />
              <span>{notice}</span>
              <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
                <X size={15} />
              </button>
            </div>
          )}

          {activeView !== "watchlist" &&
            activeView !== "charts" &&
            activeView !== "settings" && (
              <section className="stats-grid">
                <StatCard
                  label="Tracked equities"
                  value={marketStocks.length.toLocaleString("en-US")}
                  hint={`${market === "ALL" ? "Across 2 markets" : market === "IN" ? "Indian equities" : "US equities"}`}
                  icon={Globe2}
                />
                <StatCard
                  label="Average change"
                  value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
                  hint={
                    avgChange >= 0 ? "Positive breadth" : "Negative breadth"
                  }
                  trend={avgChange >= 0 ? "up" : "down"}
                  icon={Activity}
                />
                <StatCard
                  label="Top gainer"
                  value={topGainer ? topGainer.symbol : "—"}
                  hint={
                    topGainer
                      ? `+${topGainer.change.toFixed(2)}% today`
                      : "No results"
                  }
                  trend="up"
                  icon={TrendingUp}
                />
                <StatCard
                  label="Total volume"
                  value={new Intl.NumberFormat("en", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(totalVolume)}
                  hint="Shares traded · demo"
                  icon={BarChart3Fallback}
                />
              </section>
            )}

          {activeView === "overview" && (
            <section className="overview-grid">
              <article className="panel featured-panel">
                <div className="panel-heading">
                  <div>
                    <div className="panel-kicker">MARKET SNAPSHOT</div>
                    <h2>Momentum at a glance</h2>
                  </div>
                  <span className="live-chip">
                    <span /> SAMPLE
                  </span>
                </div>
                <div className="snapshot-list">
                  {[...marketStocks]
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 4)
                    .map((s, i) => (
                      <button
                        className="snapshot-row"
                        key={s.symbol}
                        onClick={() => setSelected(s)}
                      >
                        <span className="snapshot-rank">0{i + 1}</span>
                        <span
                          className={`ticker-logo ${s.market === "IN" ? "india" : "us"}`}
                        >
                          {s.symbol.slice(0, 2)}
                        </span>
                        <span className="snapshot-company">
                          <strong>{s.symbol}</strong>
                          <small>{s.company}</small>
                        </span>
                        <span className="snapshot-price">{money(s)}</span>
                        <span
                          className={`change-pill ${s.change >= 0 ? "positive" : "negative"}`}
                        >
                          {s.change >= 0 ? "+" : ""}
                          {s.change.toFixed(2)}%
                        </span>
                      </button>
                    ))}
                </div>
                <div
                  className="panel-bottom-link"
                  onClick={() => setActiveView("screener")}
                >
                  Explore all equities <span>→</span>
                </div>
              </article>
              <article className="panel breadth-panel">
                <div className="panel-heading">
                  <div>
                    <div className="panel-kicker">MARKET BREADTH</div>
                    <h2>Advancers vs decliners</h2>
                  </div>
                  <span className="breadth-icon">
                    <Activity size={17} />
                  </span>
                </div>
                <div className="breadth-counts">
                  <div>
                    <strong className="text-positive">
                      {marketStocks
                        .filter((s) => s.change > 0)
                        .length.toString()
                        .padStart(2, "0")}
                    </strong>
                    <span>Advancers</span>
                  </div>
                  <div className="breadth-divider" />
                  <div>
                    <strong className="text-negative">
                      {marketStocks
                        .filter((s) => s.change < 0)
                        .length.toString()
                        .padStart(2, "0")}
                    </strong>
                    <span>Decliners</span>
                  </div>
                </div>
                <div className="breadth-bar">
                  <span
                    style={{
                      width: `${marketStocks.length ? (marketStocks.filter((s) => s.change > 0).length / marketStocks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="breadth-legend">
                  <span>
                    <i className="legend-green" /> Gaining
                  </span>
                  <span>
                    <i className="legend-red" /> Losing
                  </span>
                  <span>{marketStocks.length} stocks</span>
                </div>
                <div className="insight-card">
                  <div className="insight-icon">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <strong>
                      {avgChange >= 0 ? "Positive momentum" : "Mixed momentum"}
                    </strong>
                    <p>
                      {avgChange >= 0
                        ? "More stocks are advancing in the selected universe."
                        : "The selected universe is showing downside pressure."}{" "}
                      Sample data only.
                    </p>
                  </div>
                </div>
              </article>
            </section>
          )}

          {(activeView === "overview" || activeView === "charts") && (
            <section className="panel main-chart-panel">
              <div className="panel-heading main-chart-heading">
                <div>
                  <div className="panel-kicker">PRICE ANALYTICS</div>
                  <h2>Stock performance</h2>
                  <p className="panel-description">
                    Select a ticker to inspect its illustrative intraday price
                    movement.
                  </p>
                </div>
                <label className="chart-stock-select">
                  <span>Chart ticker</span>
                  <select
                    aria-label="Choose stock for chart"
                    value={chartStock?.symbol || ""}
                    onChange={(e) => setChartSymbol(e.target.value)}
                  >
                    {marketStocks.slice(0, 100).map((s) => (
                      <option key={`${s.market}-${s.symbol}`} value={s.symbol}>
                        {s.symbol} · {s.market === "IN" ? "India" : "US"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {chartStock ? (
                <>
                  <div className="main-chart-summary">
                    <div>
                      <strong>{chartStock.symbol}</strong>
                      <span>
                        {chartStock.company} · {chartStock.exchange}
                      </span>
                    </div>
                    <div className="main-chart-price">
                      <strong>{money(chartStock)}</strong>
                      <span
                        className={
                          chartStock.change >= 0
                            ? "text-positive"
                            : "text-negative"
                        }
                      >
                        {chartStock.change >= 0 ? "+" : ""}
                        {chartStock.change.toFixed(2)}% today
                      </span>
                    </div>
                    <button
                      className="button button-secondary"
                      onClick={() => setSelected(chartStock)}
                    >
                      Stock details <ExternalLinkFallback />
                    </button>
                  </div>
                  <div className="main-chart-canvas">
                    <PriceChart
                      stock={chartStock}
                      livePrice={livePrices[chartStock.symbol]}
                    />

                    <CandlestickChart
                      data={chartStock.candles ?? []}
                      symbol={chartStock.symbol}
                      exchange={chartStock.exchange}
                      interval="1day"
                      livePrice={
                        livePrices[
                          `${chartStock.market === "US" || chartStock.exchange === "NASDAQ" || chartStock.exchange === "NYSE" ? "US" : "IN"}:${chartStock.symbol}`
                        ]?.price ?? chartStock.price
                      }
                      timeframeSeconds={60}
                    />

                    <CircularAnalytics stock={chartStock} stocks={stocks} />
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  No stocks available for charting.
                </div>
              )}
            </section>
          )}

          {activeView !== "charts" && activeView !== "settings" && (
            <section className="panel screener-panel">
              <div className="panel-heading screener-heading">
                <div>
                  <div className="panel-kicker">
                    {activeView === "watchlist"
                      ? "SAVED EQUITIES"
                      : "DISCOVER OPPORTUNITIES"}
                  </div>
                  <h2>
                    {activeView === "watchlist"
                      ? "Your saved stocks"
                      : "Equity screener"}{" "}
                    <span className="heading-count">
                      {filteredStocks.length}
                    </span>
                  </h2>
                  <p className="panel-description">
                    Search and compare equities across supported markets.
                  </p>
                </div>
                <div className="table-toolbar">
                  <label className="search-box">
                    <Search size={16} />
                    <input
                      aria-label="Search stocks"
                      placeholder="Search symbol, company…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <kbd>⌘ K</kbd>
                  </label>
                  <button
                    className={`icon-button filter-toggle ${showFilters ? "active" : ""}`}
                    aria-label="Toggle advanced filters"
                    onClick={() => setShowFilters((v) => !v)}
                  >
                    <SlidersHorizontal size={17} />
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="filters-row">
                  <div className="basic-filters-grid">
                    <label className="filter-field">
                      <span>Sector</span>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                      >
                        {sectors.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="filter-field">
                      <span>Performance</span>
                      <select
                        value={minChange}
                        onChange={(e) => setMinChange(e.target.value)}
                      >
                        <option value="all">All movements</option>
                        <option value="gainers">Gainers only</option>
                        <option value="losers">Losers only</option>
                        <option value="2">Change ≥ 2%</option>
                      </select>
                    </label>
                    <label className="filter-field">
                      <span>Min price</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="No minimum"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                    </label>
                    <label className="filter-field">
                      <span>Max price</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="No maximum"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </label>
                    <button className="reset-filters" onClick={resetFilters}>
                      Reset all filters
                    </button>
                  </div>
                  <details className="metric-filter-details">
                    <summary>
                      Advanced screening · 30 financial and technical metrics{" "}
                      <span>
                        {activeMetricCount
                          ? `${activeMetricCount} active`
                          : "Optional"}
                      </span>
                    </summary>
                    <div className="metric-filter-grid">
                      {FILTER_METRICS.map((metric) => (
                        <div className="metric-filter-item" key={metric.key}>
                          <span>{metric.label}</span>
                          <div>
                            <input
                              aria-label={`${metric.label} minimum`}
                              type="number"
                              placeholder="Min"
                              value={metricFilters[metric.key]?.min ?? ""}
                              onChange={(e) =>
                                setMetricFilters((current) => ({
                                  ...current,
                                  [metric.key]: {
                                    ...current[metric.key],
                                    min: e.target.value,
                                  },
                                }))
                              }
                            />
                            <input
                              aria-label={`${metric.label} maximum`}
                              type="number"
                              placeholder="Max"
                              value={metricFilters[metric.key]?.max ?? ""}
                              onChange={(e) =>
                                setMetricFilters((current) => ({
                                  ...current,
                                  [metric.key]: {
                                    ...current[metric.key],
                                    max: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="filter-disclaimer">
                      Fundamental and technical values are generated demo
                      metrics for screening-flow testing, not verified market
                      fundamentals.
                    </p>
                  </details>
                </div>
              )}

              <div className="table-meta">
                <div className="table-meta-left">
                  <span className="table-status-dot" />
                  {activeView === "watchlist"
                    ? "Your watchlist"
                    : market === "ALL"
                      ? "All markets"
                      : market === "IN"
                        ? "Indian market"
                        : "US market"}{" "}
                  <span className="meta-divider">/</span>{" "}
                  {filteredStocks.length} results
                </div>
                <div className="table-meta-right">
                  <span className="data-mode">
                    <span /> 5,000-record demo universe
                  </span>
                  <button className="export-button" onClick={exportCsv}>
                    Export CSV
                  </button>
                </div>
              </div>
              <StockTable
                stocks={filteredStocks}
                watchlist={watchlist}
                onToggleWatch={toggle}
                onSelect={setSelected}
                sort={sort}
                onSort={(key) =>
                  setSort((s) => ({
                    key,
                    direction:
                      s.key === key && s.direction === "asc" ? "desc" : "asc",
                  }))
                }
              />
            </section>
          )}

          {activeView === "settings" && (
            <section className="panel settings-panel">
              <div className="panel-kicker">PREFERENCES</div>
              <h2>Workspace settings</h2>
              <p className="panel-description">
                Personalize your StockScope experience. These preferences are
                stored for this session only.
              </p>
              <div className="settings-grid">
                <article className="settings-card">
                  <span className="settings-icon">
                    <Palette size={18} />
                  </span>
                  <div>
                    <h3>Dashboard accent</h3>
                    <p>
                      Choose the highlight color for buttons, active navigation
                      and charts.
                    </p>
                    <div className="theme-options">
                      <button
                        className={theme === "violet" ? "selected" : ""}
                        onClick={() => setTheme("violet")}
                      >
                        <i className="swatch violet" />
                        Violet
                      </button>
                      <button
                        className={theme === "teal" ? "selected" : ""}
                        onClick={() => setTheme("teal")}
                      >
                        <i className="swatch teal" />
                        Teal
                      </button>
                      <button
                        className={theme === "amber" ? "selected" : ""}
                        onClick={() => setTheme("amber")}
                      >
                        <i className="swatch amber" />
                        Amber
                      </button>
                    </div>
                  </div>
                </article>
                <article className="settings-card">
                  <span className="settings-icon">
                    <Globe2 size={18} />
                  </span>
                  <div>
                    <h3>Market coverage</h3>
                    <p>
                      Switch between Indian equities, US equities, or the
                      combined universe.
                    </p>
                    <div className="theme-options">
                      <button
                        className={market === "ALL" ? "selected" : ""}
                        onClick={() => setMarket("ALL")}
                      >
                        All markets
                      </button>
                      <button
                        className={market === "IN" ? "selected" : ""}
                        onClick={() => setMarket("IN")}
                      >
                        India
                      </button>
                      <button
                        className={market === "US" ? "selected" : ""}
                        onClick={() => setMarket("US")}
                      >
                        United States
                      </button>
                    </div>
                  </div>
                </article>
                <article className="settings-card">
                  <span className="settings-icon">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <h3>Data & privacy</h3>
                    <p>
                      Demo quotes and synthetic metrics are illustrative. API
                      keys must never be committed; use a server-side proxy for
                      production.
                    </p>
                    <span className="settings-badge">Local demo mode</span>
                  </div>
                </article>
                <article className="settings-card">
                  <span className="settings-icon">
                    <UserRound size={18} />
                  </span>
                  <div>
                    <h3>Account</h3>
                    <p>
                      Create a local demo profile or return to guest mode. This
                      does not create a server account.
                    </p>
                    <div className="theme-options">
                      <button
                        className="selected"
                        onClick={() => setAccountDialog("create")}
                      >
                        <UserPlus size={13} /> Create account
                      </button>
                      <button
                        onClick={() => {
                          setAccountName("Guest analyst");
                          setAccountEmail("");
                          setToast("Signed out of local demo.");
                        }}
                      >
                        {" "}
                        <LogOut size={13} /> Log out
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          )}
          {toast && (
            <div className="notice notice-success" role="status">
              <Check size={16} />
              <span>{toast}</span>
              <button onClick={() => setToast("")} aria-label="Dismiss message">
                <X size={15} />
              </button>
            </div>
          )}
          {accountDialog === "create" && (
            <div
              className="modal-backdrop"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setAccountDialog("");
              }}
            >
              <section
                className="account-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-account-title"
              >
                <div className="modal-header">
                  <div>
                    <div className="panel-kicker">STOCKSCOPE PROFILE</div>
                    <h2 id="create-account-title">Create your account</h2>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => setAccountDialog("")}
                    aria-label="Close dialog"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="panel-description">
                  This is a local demo profile; authentication backend is not
                  connected.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAccountName(
                      e.currentTarget.elements.fullName.value.trim() ||
                        "New analyst",
                    );
                    setAccountEmail(
                      e.currentTarget.elements.email.value.trim(),
                    );
                    setAccountDialog("");
                    setToast("Demo profile created in this session.");
                  }}
                >
                  <label className="filter-field">
                    <span>Full name</span>
                    <input name="fullName" placeholder="Your name" required />
                  </label>
                  <label className="filter-field">
                    <span>Email address</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                  <label className="filter-field">
                    <span>Password</span>
                    <input
                      name="password"
                      type="password"
                      minLength="6"
                      placeholder="At least 6 characters"
                      required
                    />
                  </label>
                  <button className="button button-primary" type="submit">
                    <UserPlus size={15} /> Create demo profile
                  </button>
                </form>
              </section>
            </div>
          )}
          <footer className="page-footer">
            <span>
              © 2026 StockScope · Built for learning and portfolio
              demonstration.
            </span>
            <div>
              <span className="footer-status">
                <i /> Interface operational
              </span>
              <a
                href="https://twelvedata.com/"
                target="_blank"
                rel="noreferrer"
              >
                Market data provider ↗
              </a>
            </div>
          </footer>
        </div>
      </main>
      {mobileNav && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation overlay"
          onClick={() => setMobileNav(false)}
        />
      )}
      <StockDetails
        stock={selected}
        onClose={() => setSelected(null)}
        saved={selected ? watchlist.includes(selected.symbol) : false}
        onToggleWatch={toggle}
      />
    </div>
  );
}

function BarChart3Fallback({ size = 17 }) {
  return <Activity size={size} />;
}

function ExternalLinkFallback() {
  return <span aria-hidden="true">↗</span>;
}
