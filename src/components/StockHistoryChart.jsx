
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchStockHistory } from "../services/stockHistoryApi";
import "./StockHistoryChart.css";

const ranges = ["1D", "1W", "1M", "6M", "1Y", "5Y"];
const historyCache = new Map();

function makeDemoHistory(stock, range) {
  const config = {
    "1D": { count: 24, days: 1 },
    "1W": { count: 7, days: 7 },
    "1M": { count: 30, days: 30 },
    "6M": { count: 26, days: 183 },
    "1Y": { count: 52, days: 365 },
    "5Y": { count: 60, days: 1825 },
  }[range];

  const basePrice = Number(stock?.price) || 1000;
  const result = [];
  const now = new Date();

  for (let i = config.count - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(
      now.getDate() -
        Math.round((i * config.days) / Math.max(config.count - 1, 1))
    );

    // Deterministic illustrative movement, not real market data
    const movement =
      Math.sin(i * 1.7) * 0.018 +
      Math.cos(i * 0.63) * 0.012 +
      ((i % 5) - 2) * 0.002;

    result.push({
      date:
        range === "1D"
          ? `${String(date.getHours()).padStart(2, "0")}:00`
          : date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: range === "5Y" ? "2-digit" : undefined,
            }),
      price: Number((basePrice * (1 + movement)).toFixed(2)),
    });
  }

  return result;
}

export default function StockHistoryChart({ stock }) {
  const [range, setRange] = useState("1M");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!stock?.symbol) return;

    let cancelled = false;
    const cacheKey = `${stock.symbol}-${stock.exchange || ""}-${range}`;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        if (historyCache.has(cacheKey)) {
          if (!cancelled) {
            setData(historyCache.get(cacheKey));
            setDemoMode(false);
          }
          return;
        }

        const history = await fetchStockHistory(stock, range);

        if (!history.length) {
          throw new Error("No historical data returned.");
        }

        if (!cancelled) {
          historyCache.set(cacheKey, history);
          setData(history);
          setDemoMode(false);
        }
      } catch {
        if (!cancelled) {
          const demoData = makeDemoHistory(stock, range);
          setData(demoData);
          setDemoMode(true);
          historyCache.set(cacheKey, demoData);
          setError("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [stock?.symbol, stock?.exchange, stock?.price, range]);

  return (
    <section className="history-card">
      <div className="history-heading">
        <div>
          <h2>Price History · {stock?.symbol}</h2>
          <p>Historical price visualization</p>
        </div>
        <span className={demoMode ? "history-badge demo" : "history-badge"}>
          {demoMode ? "DEMO DATA" : "API DATA"}
        </span>
      </div>

      <div className="history-ranges">
        {ranges.map((item) => (
          <button
            key={item}
            className={range === item ? "active" : ""}
            onClick={() => setRange(item)}
            aria-pressed={range === item}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && <p className="history-message">Loading historical prices...</p>}

      {!loading && error && (
        <p className="history-message">{error}</p>
      )}

      {!loading && data.length > 0 && (
        <>
          {demoMode && (
            <p className="demo-notice">
              Illustrative sample data — these are NOT actual market prices.
              Live historical data is unavailable from the current API plan.
            </p>
          )}

          <div className="history-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 12, left: 8, bottom: 5 }}
              >
                <CartesianGrid stroke="#29364a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9caec4", fontSize: 11 }}
                  minTickGap={30}
                  axisLine={{ stroke: "#344258" }}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#9caec4", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111b2b",
                    border: "1px solid #344258",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => [
                    Number(value).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    }),
                    "Illustrative price",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Price"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#a78bfa" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
