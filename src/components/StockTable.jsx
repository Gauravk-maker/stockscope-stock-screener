import { ArrowDown, ArrowUp, ArrowUpDown, Star, ExternalLink } from "lucide-react";

const fmtPrice = (stock) => new Intl.NumberFormat(stock.market === "IN" ? "en-IN" : "en-US", {
  style: "currency", currency: stock.currency, maximumFractionDigits: stock.market === "IN" ? 2 : 2
}).format(stock.price);

const fmtVolume = (value) => {
  if (!Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value));
};

export default function StockTable({ stocks, watchlist, onToggleWatch, onSelect, sort, onSort, page, pageSize, onPage }) {
  const columns = [
    ["symbol", "Symbol"], ["price", "Last price"], ["change", "Change"], ["volume", "Volume"], ["sector", "Sector"]
  ];
  const totalPages = Math.max(1, Math.ceil(stocks.length / pageSize));
  const rows = stocks.slice((page - 1) * pageSize, page * pageSize);
  const sortIcon = (key) => sort.key !== key ? <ArrowUpDown size={12} /> : sort.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;

  return (
    <div className="table-shell">
      <div className="table-scroll">
        <table className="stock-table">
          <thead><tr>
            <th className="star-col" aria-label="Watchlist"></th>
            {columns.map(([key, label]) => <th key={key}>
              <button className="th-sort" onClick={() => onSort(key)}>{label}{sortIcon(key)}</button>
            </th>)}
            <th><span className="sr-only">Open details</span></th>
          </tr></thead>
          <tbody>
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
            {rows.length === 0 && <tr><td colSpan="7"><div className="empty-state"><span className="empty-icon">⌕</span><strong>No stocks found</strong><p>Try changing your search or filters.</p></div></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer"><span>Showing <b>{rows.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, stocks.length)}</b> of <b>{stocks.length}</b> stocks</span><div className="pagination"><button disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button><span>{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button></div></div>
    </div>
  );
}
