import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function PriceChart({ stock }) {
  const points = (stock.history || []).map((price, index) => ({
    time: ["09:30", "10:15", "11:00", "12:00", "13:00", "14:00", "Close"][index] || `P${index + 1}`,
    price
  }));
  const positive = stock.change >= 0;
  const stroke = positive ? "#25c995" : "#ff647c";
  return (
    <div className="chart-wrap" aria-label={`${stock.symbol} illustrative price chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.24} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#202a3e" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: "#7e8aa3", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fill: "#7e8aa3", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${stock.currency === "INR" ? "₹" : "$"}${Number(v).toFixed(0)}`} />
          <Tooltip contentStyle={{ background: "#111a2c", border: "1px solid #26334b", borderRadius: 10, color: "#f2f5fa" }} formatter={(value) => [`${stock.currency === "INR" ? "₹" : "$"}${Number(value).toFixed(2)}`, "Price"]} />
          <Area type="monotone" dataKey="price" stroke={stroke} strokeWidth={2.5} fill="url(#priceFill)" activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="chart-caption">Illustrative sample history · Replace with historical API data for live charting</div>
    </div>
  );
}
