"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useLegacyTable, getCoreRowModel } from "@tanstack/react-table/legacy";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Star,
  ExternalLink,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import useLivePriceStore from "../store/livePriceStore";
const ROW_HEIGHT = 36;
const OVERSCAN = 10;

const fmtPrice = (stock, price) =>
  new Intl.NumberFormat(stock.market === "IN" ? "en-IN" : "en-US", {
    style: "currency",
    currency: stock.currency || (stock.market === "IN" ? "INR" : "USD"),
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

const fmtVolume = (value) => {
  if (value == null || value === "" || !Number.isFinite(Number(value))) {
    return "—";
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value));
};

const PriceCell = memo(
  function PriceCell({ stock, price, isLive, isPositive }) {
    const previousPriceRef = useRef(Number(price));
    const timerRef = useRef(null);
    const flashIdRef = useRef(0);
    const [flash, setFlash] = useState({
      direction: "",
      id: 0,
    });

    useEffect(() => {
      const currentPrice = Number(price);
      const previousPrice = previousPriceRef.current;

      if (
        Number.isFinite(currentPrice) &&
        Number.isFinite(previousPrice) &&
        currentPrice !== previousPrice
      ) {
        const direction = currentPrice > previousPrice ? "up" : "down";

        flashIdRef.current += 1;
        const currentId = flashIdRef.current;

        setFlash({ direction, id: currentId });

        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          setFlash((current) =>
            current.id === currentId ? { ...current, direction: "" } : current,
          );
          timerRef.current = null;
        }, 300);
      }

      previousPriceRef.current = currentPrice;

      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [price]);

    const liveClass = isLive
      ? isPositive
        ? "live-price-up"
        : "live-price-down"
      : "";

    const flashClass = flash.direction
      ? `price-flash price-flash-${flash.direction}`
      : "";

    return (
      <td className="price-cell">
        <span key={flash.id} className={`${liveClass} ${flashClass}`.trim()}>
          {fmtPrice(stock, price)}
        </span>
      </td>
    );
  },
  (previous, next) =>
    previous.stock.symbol === next.stock.symbol &&
    previous.stock.market === next.stock.market &&
    previous.stock.currency === next.stock.currency &&
    previous.stock.exchange === next.stock.exchange &&
    previous.price === next.price &&
    previous.isLive === next.isLive &&
    previous.isPositive === next.isPositive,
);
export default function StockTable({
  stocks = [],
  watchlist = [],
  onToggleWatch,
  onSelect,
  sort,
  onSort,
}) {
  const scrollRef = useRef(null);

  // Hooks must be called inside the component.

  const columns = [
    ["symbol", "Symbol"],
    ["price", "Last price"],
    ["change", "Change"],
    ["volume", "Volume"],
    ["sector", "Sector"],
  ];

  const tableColumns = useMemo(
    () => [
      { accessorKey: "symbol", header: "Symbol" },
      { accessorKey: "price", header: "Last price" },
      { accessorKey: "change", header: "Change" },
      { accessorKey: "volume", header: "Volume" },
      { accessorKey: "sector", header: "Sector" },
    ],
    [],
  );

  // Apply live values to the table data without mutating props.
  const livePrices = useLivePriceStore((state) => state.prices);
  const wsStatus = useLivePriceStore((state) => state.prices);
  const liveStocks = useMemo(
    () =>
      stocks.map((stock) => {
        const market =
          stock.market === "US" ||
          stock.market === "USA" ||
          stock.exchange === "NASDAQ" ||
          stock.exchange === "NYSE"
            ? "US"
            : "IN";

        const live = livePrices[`${market}:${stock.symbol}`];

        if (!live) return stock;

        return {
          ...stock,
          price: live.price,
          liveChange: live.change,
          isLive: true,
        };
      }),
    [stocks, livePrices],
  );

  const table = useLegacyTable({
    data: liveStocks,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
    getItemKey: (index) => tableRows[index]?.id ?? index,
    initialRect: {
      width: 1000,
      height: 540,
    },
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const sortIcon = (key) => {
    if (sort?.key !== key) {
      return <ArrowUpDown size={12} />;
    }

    return sort.direction === "asc" ? (
      <ArrowUp size={12} />
    ) : (
      <ArrowDown size={12} />
    );
  };

  const uniqueRows = Array.from(
    new Map(virtualRows.map((row) => [row.index, row])).values(),
  );

  const visibleRows =
    uniqueRows.length > 0
      ? uniqueRows
      : tableRows
          .slice(0, Math.min(20, tableRows.length))
          .map((row, index) => ({
            key: row.id ?? index,
            index,
            start: index * ROW_HEIGHT,
            end: (index + 1) * ROW_HEIGHT,
          }));

  const paddingTop = visibleRows.length > 0 ? visibleRows[0].start : 0;

  const lastVisibleRow =
    visibleRows.length > 0 ? visibleRows[visibleRows.length - 1] : null;

  const paddingBottom = lastVisibleRow
    ? Math.max(0, rowVirtualizer.getTotalSize() - lastVisibleRow.end)
    : 0;

  return (
    <div className="table-shell">
      <div className="table-toolbar-status">
        <span
          className={`ws-status ${
            wsStatus === "connected" ? "ws-connected" : "ws-disconnected"
          }`}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">●</span>{" "}
          {wsStatus === "connected"
            ? "Simulated feed connected"
            : wsStatus === "connecting"
              ? "Connecting to price feed..."
              : "Price feed disconnected — reconnecting"}
        </span>
      </div>

      <div
        className="table-scroll virtual-table-scroll"
        ref={scrollRef}
        role="region"
        aria-label="Stock screener results"
        tabIndex={0}
      >
        <table
          className="stock-table"
          aria-rowcount={liveStocks.length + 1}
          aria-label="Stock screener"
        >
          <thead>
            <tr>
              <th className="star-col" aria-label="Watchlist" />

              {columns.map(([key, label]) => (
                <th key={key}>
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => onSort?.(key)}
                    aria-label={`Sort by ${label}`}
                  >
                    {label}
                    {sortIcon(key)}
                  </button>
                </th>
              ))}

              <th>
                <span className="sr-only">Open details</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <span className="empty-icon">⌕</span>
                    <strong>No stocks found</strong>
                    <p>Try changing your search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {paddingTop > 0 && (
                  <tr className="virtual-spacer" aria-hidden="true">
                    <td
                      colSpan={7}
                      style={{
                        height: paddingTop,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                )}

                {visibleRows.map((virtualRow) => {
                  const stock = tableRows[virtualRow.index]?.original;

                  if (!stock) return null;

                  const isSaved = watchlist.includes(stock.symbol);
                  const live = livePrices[stock.symbol];

                  const price = live?.price ?? stock.price;

                  // Keep the original percentage change when the
                  // WebSocket does not provide a market percentage.
                  const change =
                    live?.change != null
                      ? live.change
                      : Number(stock.change) || 0;

                  const isPositive = change >= 0;

                  return (
                    <tr
                      key={`${stock.market}-${stock.symbol}`}
                      style={{ height: ROW_HEIGHT }}
                    >
                      <td className="star-col">
                        <button
                          type="button"
                          className={`icon-button star-button ${
                            isSaved ? "saved" : ""
                          }`}
                          aria-label={`${
                            isSaved ? "Remove" : "Add"
                          } ${stock.symbol} ${
                            isSaved ? "from" : "to"
                          } watchlist`}
                          onClick={() => onToggleWatch?.(stock.symbol)}
                        >
                          <Star
                            size={16}
                            fill={isSaved ? "currentColor" : "none"}
                          />
                        </button>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="symbol-cell"
                          onClick={() => onSelect?.(stock)}
                        >
                          <span
                            className={`ticker-logo ${
                              stock.market === "IN" ? "india" : "us"
                            }`}
                          >
                            {stock.symbol.slice(0, 2)}
                          </span>

                          <span>
                            <strong>{stock.symbol}</strong>
                            <small>{stock.company}</small>
                          </span>
                        </button>
                      </td>

                      <PriceCell
                        stock={stock}
                        price={price}
                        isLive={Boolean(live)}
                        isPositive={isPositive}
                      />

                      <td>
                        <span
                          className={`change-pill ${
                            isPositive ? "positive" : "negative"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {change.toFixed(2)}
                          {live ? "" : "%"}
                        </span>
                      </td>

                      <td className="muted-cell">{fmtVolume(stock.volume)}</td>

                      <td>
                        <span className="sector-tag">{stock.sector}</span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`View ${stock.symbol} details`}
                          onClick={() => onSelect?.(stock)}
                        >
                          <ExternalLink size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {paddingBottom > 0 && (
                  <tr className="virtual-spacer" aria-hidden="true">
                    <td
                      colSpan={7}
                      style={{
                        height: paddingBottom,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>
          Showing{" "}
          <b>
            {visibleRows.length > 0
              ? `${visibleRows[0].index + 1}–${
                  visibleRows[visibleRows.length - 1].index + 1
                }`
              : "0"}
          </b>{" "}
          of <b>{liveStocks.length.toLocaleString()}</b> stocks · Virtualized
          rendering
        </span>

        <span className="virtual-hint">
          Scroll to explore the full result set
        </span>
      </div>
    </div>
  );
}
