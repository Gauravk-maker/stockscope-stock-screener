
"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { calculateRSI } from "../utils/indicators.js";
import { initialStocks } from "../data/stocks.js";

const COLORS = {
  india: "#8b5cf6",
  us: "#22d3ee",
  up: "#22c55e",
  down: "#fb7185",
  flat: "#94a3b8",
  rsi: "#8b5cf6",
};

const tooltipStyle = {
  background: "#111a2c",
  border: "1px solid #26334b",
  borderRadius: 10,
  color: "#f2f5fa",
};

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="circular-analytics-card">
      <div className="circular-analytics-heading">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Donut({ data, centerValue, centerLabel }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return <p className="circular-empty">No data available for this chart.</p>;
  }

  return (
    <>
      <div className="circular-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="86%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [
                Number(value).toLocaleString(),
                "Stocks",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="circular-chart-center">
          <strong>{Number(centerValue).toLocaleString()}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <div className="circular-legend">
        {data.map((item) => (
          <div className="circular-legend-item" key={item.name}>
            <span
              className="circular-legend-dot"
              style={{ background: item.color }}
            />
            <span>{item.name}</span>
            <strong>{item.value.toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

export default function CircularAnalytics({
  stock,
  stocks = initialStocks,
}) {
  const safeStocks = Array.isArray(stocks) ? stocks : [];

  const marketData = useMemo(() => {
    let india = 0;
    let us = 0;

    for (const item of safeStocks) {
      const market = String(
        item.market || item.exchange || ""
      ).toUpperCase();

      if (["IN", "INDIA", "NSE", "BSE"].includes(market)) {
        india++;
      } else if (
        ["US", "USA", "NASDAQ", "NYSE"].includes(market)
      ) {
        us++;
      }
    }

    return [
      { name: "India", value: india, color: COLORS.india },
      { name: "United States", value: us, color: COLORS.us },
    ].filter((item) => item.value > 0);
  }, [safeStocks]);

  const breadthData = useMemo(() => {
    let advancing = 0;
    let declining = 0;
    let unchanged = 0;

    for (const item of safeStocks) {
      const change = Number(item.change);

      if (!Number.isFinite(change) || change === 0) {
        unchanged++;
      } else if (change > 0) {
        advancing++;
      } else {
        declining++;
      }
    }

    return [
      { name: "Advancing", value: advancing, color: COLORS.up },
      { name: "Declining", value: declining, color: COLORS.down },
      { name: "Unchanged", value: unchanged, color: COLORS.flat },
    ];
  }, [safeStocks]);

  const rsi = useMemo(() => {
    const prices = (stock?.history || [stock?.price])
      .map(Number)
      .filter((value) => Number.isFinite(value) && value > 0);

    if (prices.length < 2) return null;

    const values = calculateRSI(prices, 14);
    const last = values?.[values.length - 1];
    const result = Number(last);

    return Number.isFinite(result)
      ? Math.max(0, Math.min(100, result))
      : null;
  }, [stock]);

  const rsiLabel =
    rsi === null
      ? "Not enough price history"
      : rsi >= 70
        ? "Overbought"
        : rsi <= 30
          ? "Oversold"
          : "Neutral zone";

  const rsiGaugeData = [
    { name: "RSI", value: rsi ?? 0, fill: COLORS.rsi },
  ];

  return (
    <section className="circular-analytics-section">
      <div className="circular-section-title">
        <div>
          <span className="circular-eyebrow">MARKET INSIGHTS</span>
          <h2>Circular analytics</h2>
          <p>Market distribution, RSI and advancing/declining stocks.</p>
        </div>
      </div>

      <div className="circular-analytics-grid">
        <ChartCard
          title="Market distribution"
          subtitle="India vs United States"
        >
          <Donut
            data={marketData}
            centerValue={marketData.reduce(
              (sum, item) => sum + item.value,
              0
            )}
            centerLabel="Stocks"
          />
        </ChartCard>

        <ChartCard
          title="Relative Strength Index"
          subtitle={`${stock?.symbol || "Selected stock"} · 14 periods`}
        >
          {rsi === null ? (
            <div className="circular-empty rsi-unavailable">
              Not enough valid price history to calculate RSI.
            </div>
          ) : (
            <>
              <div className="circular-chart rsi-gauge">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    data={rsiGaugeData}
                    startAngle={180}
                    endAngle={0}
                    innerRadius="72%"
                    outerRadius="100%"
                    barSize={16}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      tick={false}
                    />
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      background={{ fill: "#26334b" }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [
                        Number(value).toFixed(1),
                        "RSI",
                      ]}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="rsi-gauge-center">
                  <strong>{rsi.toFixed(1)}</strong>
                  <span>RSI / 100</span>
                </div>
              </div>
              <div className="rsi-status">
                <span
                  className={`rsi-dot ${
                    rsi >= 70
                      ? "rsi-high"
                      : rsi <= 30
                        ? "rsi-low"
                        : "rsi-neutral"
                  }`}
                />
                {rsiLabel}
              </div>
              <div className="rsi-scale">
                <span>0</span>
                <span>30 · Oversold</span>
                <span>70 · Overbought</span>
                <span>100</span>
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard
          title="Market breadth"
          subtitle="Advancing vs declining stocks"
        >
          <Donut
            data={breadthData}
            centerValue={breadthData.reduce(
              (sum, item) => sum + item.value,
              0
            )}
            centerLabel="Tracked"
          />
        </ChartCard>
      </div>

      <p className="circular-disclaimer">
        Based on the dashboard's available stock dataset. Synthetic demo
        records are illustrative and do not represent verified live-market
        statistics.
      </p>
    </section>
  );
}
