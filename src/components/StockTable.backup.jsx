import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Star, ExternalLink } from "lucide-react";

const ROW_HEIGHT = 50;
const VIEWPORT_HEIGHT = 540;
const OVERSCAN = 8;

const fmtPrice = (stock) => new Intl.NumberFormat(stock.market === "IN" ? "en-IN" : "en-US", {
  style: "currency", currency: stock.currency, maximumFractionDigits: 2
}).format(stock.price);

const fmtVolume = (value) => {
  if (!Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value));
};

export default function StockTable({ stocks, watchlist, onToggleWatch, onSelect, sort, onSort }) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef(null);
  const columns = [
    ["symbol", "Symbol"], ["price", "Last price"], ["change", "Change"], ["volume", "Volume"], ["sector", "Sector"]
  ];
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(stocks.length, startIndex + visibleCount);
  const rows = stocks.slice(startIndex, endIndex);
  const topSpacer = startIndex * ROW_HEIGHT;
  const bottomSpacer = Math.max(0, (stocks.length - endIndex) * ROW_HEIGHT);
  const sortIcon = (key) => sort.key !== key ? <ArrowUpDown size={12} /> : sort.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;

  useEffect(() => {
    setScrollTop(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [stocks]);

  return (
    <div className="table-shell">
      <div className="table-scroll virtual-table-scroll" ref={scrollRef} onScroll={event => setScrollTop(event.currentTarget.scrollTop)}>
        <table className="stock-table" aria-rowcount={stocks.length + 1}>
          <thead><tr>
            <th className="star-col" aria-label="Watchlist"></th>
            {columns.map(([key, label]) => <th key={key}>
              <button className="th-sort" onClick={() => onSort(key)}>{label}{sortIcon(key)}</button>
            </th>)}
            <th><span className="sr-only">Open details</span></th>
          </tr></thead>
          <tbody>
            {topSpacer > 0 && <tr className="virtual-spacer" aria-hidden="true"><td colSpan="7" style={{ height: topSpacer, padding: 0, border: 0 }} /></tr>}
            {rows.map((stock) => {
              const isSaved = watchlist.includes(stock.symbol);
              return <tr key={`${stock.market}-${stock.symbol}`}>
                <td className="star-col"><button className={`icon-button star-button ${isSaved ? "saved" : ""}`} aria-label={`${isSaved ? "Remove" : "Add"} ${stock.symbol} ${isSaved ? "from" : "to"} watchlist`} onClick={() => onToggleWatch(stock.symbol)}><Star size={16} fill={isSaved ? "currentColor" : "none"} /></button></td>
                <td><button className="symbol-cell" onClick={() => onSelect(stock)}><span className={`ticker-logo ${stock.market === "IN" ? "india" : "us"}`}>{stock.symbol.slice(0, 2)}</span><span><strong>{stock.symbol}</strong><small>{stock.company}</small></span></button></td>
                <td className="price-cell">{fmtPrice(stock)}</td>
                <td><span className={`change-pill ${stock.change >= 0 ? "positive" : "negative"}`}>{stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%</span></td>
                <td className="muted-cell">{fmtVolume(stock.volume)}</td>
                <td><span className="sector-tag">{stock.sector}</span></td>
                <td><button className="icon-button" aria-label={`View ${stock.symbol} details`} onClick={() => onSelect(stock)}><ExternalLink size={15}/></button></td>
              </tr>;
            })}
            {bottomSpacer > 0 && <tr className="virtual-spacer" aria-hidden="true"><td colSpan="7" style={{ height: bottomSpacer, padding: 0, border: 0 }} /></tr>}
            {stocks.length === 0 && <tr><td colSpan="7"><div className="empty-state"><span className="empty-icon">⌕</span><strong>No stocks found</strong><p>Try changing your search or filters.</p></div></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer"><span>Showing <b>{stocks.length ? `${startIndex + 1}–${endIndex}` : "0"}</b> of <b>{stocks.length.toLocaleString()}</b> stocks · Virtualized rendering</span><span className="virtual-hint">Scroll to explore the full result set</span></div>
    </div>
  );
}
