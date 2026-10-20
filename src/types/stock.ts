export interface Stock {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE" | "NASDAQ" | "NYSE" | string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio?: number;
  dayHigh?: number;
  dayLow?: number;
  week52High?: number;
  week52Low?: number;
}

export interface StockFilters {
  exchanges: string[];
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minChangePercent?: number;
  maxChangePercent?: number;
  minVolume?: number;
  minPE?: number;
  maxPE?: number;
  search: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    total?: number;
  };
}