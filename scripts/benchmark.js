import { performance } from "node:perf_hooks";
import { initialStocks } from "../src/data/stocks.js";
import { matchesMetricFilters } from "../src/utils/screener.js";

const bounds = { price: { min: "100", max: "10000" }, peRatio: { min: "10", max: "35" }, rsi: { min: "30", max: "70" }, volume: { min: "100000" } };
const measure = (label, run, repetitions = 35) => {
  for (let i = 0; i < 5; i += 1) run();
  const samples = [];
  for (let i = 0; i < repetitions; i += 1) {
    const start = performance.now(); run(); samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length * 0.5)];
  const p95 = samples[Math.min(samples.length - 1, Math.ceil(samples.length * 0.95) - 1)];
  console.log(`${label}: median ${median.toFixed(2)} ms | p95 ${p95.toFixed(2)} ms (${repetitions} runs)`);
};

console.log(`StockScope local data benchmark · ${initialStocks.length.toLocaleString()} records · synthetic demo metrics`);
measure("30-metric-style filtering (active 4 bounds)", () => initialStocks.filter(stock => matchesMetricFilters(stock, bounds)));
measure("Numeric sort by volume", () => [...initialStocks].sort((a, b) => b.volume - a.volume));
measure("Search + metric filtering", () => initialStocks.filter(stock => (stock.symbol.includes("SIM") || stock.company.toLowerCase().includes("apple")) && matchesMetricFilters(stock, bounds)));
console.log("Note: this is a Node.js data-operation benchmark, not browser render, scrolling FPS, memory, or WebSocket latency testing.");
