import { X, Star, ArrowUpRight, ArrowDownRight, Building2, Activity, BarChart3 } from "lucide-react";
import PriceChart from "./PriceChart.jsx";

const currency = (stock) => new Intl.NumberFormat(stock.market === "IN" ? "en-IN" : "en-US", { style: "currency", currency: stock.currency, maximumFractionDigits: 2 }).format(stock.price);

export default function StockDetails({ stock, onClose, saved, onToggleWatch }) {
  if (!stock) return null;
  const positive = stock.change >= 0;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <header className="modal-header"><div className="modal-company"><span className={`ticker-logo large ${stock.market === "IN" ? "india" : "us"}`}>{stock.symbol.slice(0,2)}</span><div><h2 id="detail-title">{stock.company}</h2><p>{stock.symbol} · {stock.exchange} · {stock.sector}</p></div></div><button className="icon-button" aria-label="Close stock details" onClick={onClose}><X/></button></header>
      <div className="detail-price-row"><div><div className="detail-price">{currency(stock)}</div><div className={`detail-change ${positive ? "text-positive" : "text-negative"}`}>{positive ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>} {positive ? "+" : ""}{stock.change.toFixed(2)}% today</div></div><button className={`button ${saved ? "button-saved" : "button-primary"}`} onClick={() => onToggleWatch(stock.symbol)}><Star size={15} fill={saved ? "currentColor" : "none"}/>{saved ? "In watchlist" : "Add to watchlist"}</button></div>
      <div className="detail-chart-title"><div><h3>Price movement</h3><p>Sample intraday trend</p></div><span className="period-chip">1D</span></div>
      <div className="detail-chart"><PriceChart stock={stock}/></div>
      <div className="detail-stats">
        <div><span><Activity size={14}/> Daily change</span><strong className={positive ? "text-positive" : "text-negative"}>{positive ? "+" : ""}{stock.change.toFixed(2)}%</strong></div>
        <div><span><BarChart3 size={14}/> Volume</span><strong>{new Intl.NumberFormat("en", { notation: "compact" }).format(stock.volume)}</strong></div>
        <div><span><Building2 size={14}/> Market cap</span><strong>{stock.marketCap || "—"}</strong></div>
        <div><span>Market</span><strong>{stock.market === "IN" ? "India" : "United States"}</strong></div>
      </div>
      <p className="data-disclaimer">Demo price history and metrics are illustrative. Verify live quotes and exchange coverage with your configured provider.</p>
    </section>
  </div>;
}
