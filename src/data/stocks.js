// Clearly labelled demo values. Replace with a permitted live data feed for production.
const seedStocks = [
  { symbol: "RELIANCE", company: "Reliance Industries", market: "IN", exchange: "NSE", sector: "Energy", currency: "INR", price: 1462.35, change: 1.82, volume: 5824100, marketCap: "19.7T", history: [1428,1436,1430,1441,1438,1455,1462] },
  { symbol: "TCS", company: "Tata Consultancy Services", market: "IN", exchange: "NSE", sector: "Technology", currency: "INR", price: 3218.6, change: -0.74, volume: 1235400, marketCap: "11.6T", history: [3260,3242,3255,3228,3240,3230,3219] },
  { symbol: "HDFCBANK", company: "HDFC Bank", market: "IN", exchange: "NSE", sector: "Financials", currency: "INR", price: 968.4, change: 0.63, volume: 8472300, marketCap: "7.4T", history: [952,958,954,960,963,962,968] },
  { symbol: "INFY", company: "Infosys", market: "IN", exchange: "NSE", sector: "Technology", currency: "INR", price: 1548.9, change: 2.16, volume: 4961200, marketCap: "6.4T", history: [1502,1510,1508,1528,1520,1536,1549] },
  { symbol: "ICICIBANK", company: "ICICI Bank", market: "IN", exchange: "NSE", sector: "Financials", currency: "INR", price: 1276.2, change: 1.04, volume: 4128000, marketCap: "9.0T", history: [1250,1258,1260,1268,1262,1270,1276] },
  { symbol: "BHARTIARTL", company: "Bharti Airtel", market: "IN", exchange: "NSE", sector: "Telecom", currency: "INR", price: 1862.1, change: -0.28, volume: 1742300, marketCap: "5.1T", history: [1872,1878,1865,1871,1868,1867,1862] },
  { symbol: "LT", company: "Larsen & Toubro", market: "IN", exchange: "NSE", sector: "Industrials", currency: "INR", price: 3584.75, change: 1.35, volume: 986400, marketCap: "4.9T", history: [3512,3528,3540,3534,3560,3571,3585] },
  { symbol: "ITC", company: "ITC Limited", market: "IN", exchange: "NSE", sector: "Consumer", currency: "INR", price: 412.8, change: -1.12, volume: 3921000, marketCap: "5.2T", history: [420,418,416,419,415,414,413] },
  { symbol: "SBIN", company: "State Bank of India", market: "IN", exchange: "NSE", sector: "Financials", currency: "INR", price: 824.6, change: 0.91, volume: 3028000, marketCap: "7.3T", history: [810,815,812,819,821,818,825] },
  { symbol: "TATAMOTORS", company: "Tata Motors", market: "IN", exchange: "NSE", sector: "Automotive", currency: "INR", price: 684.25, change: -1.86, volume: 4216500, marketCap: "2.5T", history: [710,704,699,700,692,691,684] },
  { symbol: "AAPL", company: "Apple Inc.", market: "US", exchange: "NASDAQ", sector: "Technology", currency: "USD", price: 232.14, change: 1.24, volume: 48321000, marketCap: "3.5T", history: [226,228,227,230,229,231,232] },
  { symbol: "MSFT", company: "Microsoft Corporation", market: "US", exchange: "NASDAQ", sector: "Technology", currency: "USD", price: 512.6, change: 0.68, volume: 18240000, marketCap: "3.8T", history: [504,507,506,509,508,510,513] },
  { symbol: "NVDA", company: "NVIDIA Corporation", market: "US", exchange: "NASDAQ", sector: "Semiconductors", currency: "USD", price: 184.92, change: 3.72, volume: 136250000, marketCap: "4.5T", history: [174,176,178,177,181,183,185] },
  { symbol: "AMZN", company: "Amazon.com, Inc.", market: "US", exchange: "NASDAQ", sector: "Consumer", currency: "USD", price: 226.8, change: -0.42, volume: 29180000, marketCap: "2.4T", history: [230,228,229,227,228,227,227] },
  { symbol: "GOOGL", company: "Alphabet Inc.", market: "US", exchange: "NASDAQ", sector: "Communication", currency: "USD", price: 198.35, change: 0.92, volume: 21450000, marketCap: "2.4T", history: [194,195,196,195,197,198,198] },
  { symbol: "META", company: "Meta Platforms, Inc.", market: "US", exchange: "NASDAQ", sector: "Communication", currency: "USD", price: 724.2, change: 1.65, volume: 14230000, marketCap: "1.8T", history: [710,714,716,713,720,721,724] },
  { symbol: "TSLA", company: "Tesla, Inc.", market: "US", exchange: "NASDAQ", sector: "Automotive", currency: "USD", price: 338.45, change: -2.08, volume: 58420000, marketCap: "1.1T", history: [352,349,345,347,343,341,338] },
  { symbol: "JPM", company: "JPMorgan Chase & Co.", market: "US", exchange: "NYSE", sector: "Financials", currency: "USD", price: 292.4, change: 0.35, volume: 8420000, marketCap: "820B", history: [289,290,288,291,290,292,292] },
  { symbol: "WMT", company: "Walmart Inc.", market: "US", exchange: "NASDAQ", sector: "Consumer", currency: "USD", price: 103.8, change: 0.81, volume: 11940000, marketCap: "830B", history: [101,102,102,103,102,103,104] },
  { symbol: "AMD", company: "Advanced Micro Devices", market: "US", exchange: "NASDAQ", sector: "Semiconductors", currency: "USD", price: 167.25, change: -0.95, volume: 25480000, marketCap: "270B", history: [171,170,169,170,168,168,167] },
  { symbol: "NFLX", company: "Netflix, Inc.", market: "US", exchange: "NASDAQ", sector: "Communication", currency: "USD", price: 1248.6, change: 2.45, volume: 2480000, marketCap: "530B", history: [1208,1215,1220,1228,1234,1240,1249] }

  ,{ symbol: "KOTAKBANK", company: "Kotak Mahindra Bank", market: "IN", exchange: "NSE", sector: "Financials", currency: "INR", price: 1942.5, change: 0.72, volume: 1342000, marketCap: "3.8T", history: [1910,1922,1918,1930,1928,1936,1943] }
  ,{ symbol: "AXISBANK", company: "Axis Bank", market: "IN", exchange: "NSE", sector: "Financials", currency: "INR", price: 1184.3, change: 1.11, volume: 2642000, marketCap: "3.7T", history: [1160,1168,1172,1170,1178,1180,1184] }
  ,{ symbol: "MARUTI", company: "Maruti Suzuki India", market: "IN", exchange: "NSE", sector: "Automotive", currency: "INR", price: 12640, change: -0.36, volume: 325400, marketCap: "3.9T", history: [12710,12690,12680,12650,12680,12655,12640] }
  ,{ symbol: "SUNPHARMA", company: "Sun Pharmaceutical", market: "IN", exchange: "NSE", sector: "Healthcare", currency: "INR", price: 1724.8, change: 0.84, volume: 1143200, marketCap: "4.1T", history: [1690,1700,1708,1715,1710,1719,1725] }
  ,{ symbol: "TITAN", company: "Titan Company", market: "IN", exchange: "NSE", sector: "Consumer", currency: "INR", price: 3521.6, change: 1.28, volume: 672300, marketCap: "3.1T", history: [3460,3472,3480,3495,3502,3510,3522] }
  ,{ symbol: "BAJFINANCE", company: "Bajaj Finance", market: "IN", exchange: "NSE", sector: "Financials", currency: "INR", price: 982.7, change: -0.61, volume: 1832000, marketCap: "6.1T", history: [995,991,988,990,987,985,983] }
  ,{ symbol: "WIPRO", company: "Wipro Limited", market: "IN", exchange: "NSE", sector: "Technology", currency: "INR", price: 248.9, change: -0.43, volume: 2184000, marketCap: "2.6T", history: [252,251,250,251,249,250,249] }
  ,{ symbol: "HINDUNILVR", company: "Hindustan Unilever", market: "IN", exchange: "NSE", sector: "Consumer", currency: "INR", price: 2412.3, change: 0.48, volume: 734200, marketCap: "5.7T", history: [2390,2395,2400,2398,2405,2410,2412] }
  ,{ symbol: "ONGC", company: "Oil and Natural Gas Corporation", market: "IN", exchange: "NSE", sector: "Energy", currency: "INR", price: 248.15, change: 1.67, volume: 3241000, marketCap: "3.1T", history: [241,243,244,245,246,247,248] }
  ,{ symbol: "NTPC", company: "NTPC Limited", market: "IN", exchange: "NSE", sector: "Energy", currency: "INR", price: 338.2, change: 0.59, volume: 2890000, marketCap: "3.3T", history: [333,334,335,336,336,337,338] }
  ,{ symbol: "ADANIENT", company: "Adani Enterprises", market: "IN", exchange: "NSE", sector: "Industrials", currency: "INR", price: 2315.4, change: -1.24, volume: 1184200, marketCap: "2.6T", history: [2350,2340,2334,2328,2330,2322,2315] }
  ,{ symbol: "POWERGRID", company: "Power Grid Corporation", market: "IN", exchange: "NSE", sector: "Utilities", currency: "INR", price: 302.8, change: 0.33, volume: 1734200, marketCap: "2.8T", history: [299,300,300,301,301,302,303] }
  ,{ symbol: "ULTRACEMCO", company: "UltraTech Cement", market: "IN", exchange: "NSE", sector: "Materials", currency: "INR", price: 11240, change: 0.91, volume: 124500, marketCap: "3.2T", history: [11080,11120,11150,11180,11200,11210,11240] }
  ,{ symbol: "COALINDIA", company: "Coal India", market: "IN", exchange: "NSE", sector: "Energy", currency: "INR", price: 421.7, change: 1.09, volume: 2124000, marketCap: "2.6T", history: [414,416,417,418,419,420,422] }
  ,{ symbol: "ADANIPORTS", company: "Adani Ports", market: "IN", exchange: "NSE", sector: "Industrials", currency: "INR", price: 1468.4, change: -0.27, volume: 743200, marketCap: "3.2T", history: [1478,1472,1470,1475,1471,1470,1468] }
  ,{ symbol: "BAJAJFINSV", company: "Bajaj Finserv", market: "IN", exchange: "NSE", sector: "Financials", currency: "INR", price: 1985.6, change: 0.77, volume: 583400, marketCap: "3.2T", history: [1950,1960,1965,1972,1978,1980,1986] }
  ,{ symbol: "ORCL", company: "Oracle Corporation", market: "US", exchange: "NYSE", sector: "Technology", currency: "USD", price: 228.3, change: 0.58, volume: 8120000, marketCap: "640B", history: [224,225,226,226,227,228,228] }
  ,{ symbol: "INTC", company: "Intel Corporation", market: "US", exchange: "NASDAQ", sector: "Semiconductors", currency: "USD", price: 36.82, change: -1.32, volume: 48200000, marketCap: "160B", history: [38,37.8,37.5,37.2,37.1,36.9,36.8] }
  ,{ symbol: "AVGO", company: "Broadcom Inc.", market: "US", exchange: "NASDAQ", sector: "Semiconductors", currency: "USD", price: 342.6, change: 2.18, volume: 4820000, marketCap: "1.6T", history: [333,335,337,339,340,341,343] }
  ,{ symbol: "COST", company: "Costco Wholesale", market: "US", exchange: "NASDAQ", sector: "Consumer", currency: "USD", price: 986.4, change: 0.44, volume: 1240000, marketCap: "437B", history: [979,980,982,981,984,985,986] }
  ,{ symbol: "DIS", company: "The Walt Disney Company", market: "US", exchange: "NYSE", sector: "Communication", currency: "USD", price: 117.25, change: -0.18, volume: 6420000, marketCap: "210B", history: [118,117.8,117.5,117.7,117.4,117.3,117.25] }
  ,{ symbol: "UBER", company: "Uber Technologies", market: "US", exchange: "NYSE", sector: "Technology", currency: "USD", price: 94.8, change: 1.42, volume: 15200000, marketCap: "198B", history: [92,92.5,93,93.4,93.8,94.2,94.8] }
  ,{ symbol: "KO", company: "The Coca-Cola Company", market: "US", exchange: "NYSE", sector: "Consumer", currency: "USD", price: 71.2, change: 0.31, volume: 13200000, marketCap: "306B", history: [70.5,70.7,70.8,70.9,71,71.1,71.2] }
  ,{ symbol: "V", company: "Visa Inc.", market: "US", exchange: "NYSE", sector: "Financials", currency: "USD", price: 357.2, change: 0.64, volume: 5240000, marketCap: "680B", history: [352,353,354,354,355,356,357] }
  ,{ symbol: "MA", company: "Mastercard Incorporated", market: "US", exchange: "NYSE", sector: "Financials", currency: "USD", price: 586.5, change: 0.83, volume: 2380000, marketCap: "535B", history: [578,580,581,582,584,585,587] }
  ,{ symbol: "PFE", company: "Pfizer Inc.", market: "US", exchange: "NYSE", sector: "Healthcare", currency: "USD", price: 25.7, change: -0.52, volume: 19400000, marketCap: "145B", history: [26.1,26,25.9,25.8,25.9,25.8,25.7] }
  ,{ symbol: "JNJ", company: "Johnson & Johnson", market: "US", exchange: "NYSE", sector: "Healthcare", currency: "USD", price: 176.8, change: 0.22, volume: 4820000, marketCap: "426B", history: [175,175.5,175.7,176,176.2,176.5,176.8] }
  ,{ symbol: "BAC", company: "Bank of America", market: "US", exchange: "NYSE", sector: "Financials", currency: "USD", price: 48.3, change: 0.71, volume: 28400000, marketCap: "365B", history: [47.2,47.5,47.8,47.9,48,48.1,48.3] }
  ,{ symbol: "CSCO", company: "Cisco Systems", market: "US", exchange: "NASDAQ", sector: "Technology", currency: "USD", price: 69.4, change: -0.21, volume: 12800000, marketCap: "276B", history: [70,69.8,69.6,69.7,69.5,69.5,69.4] }
  ,{ symbol: "QCOM", company: "Qualcomm Incorporated", market: "US", exchange: "NASDAQ", sector: "Semiconductors", currency: "USD", price: 171.8, change: 1.03, volume: 6820000, marketCap: "190B", history: [168,169,169.5,170,170.5,171,171.8] }
  ,{ symbol: "PLTR", company: "Palantir Technologies", market: "US", exchange: "NASDAQ", sector: "Technology", currency: "USD", price: 142.6, change: 2.82, volume: 35200000, marketCap: "325B", history: [136,137,138,140,141,142,143] }
  ,{ symbol: "XOM", company: "Exxon Mobil", market: "US", exchange: "NYSE", sector: "Energy", currency: "USD", price: 119.5, change: 0.39, volume: 8420000, marketCap: "510B", history: [118,118.5,118.7,119,119,119.2,119.5] }
  ,{ symbol: "BA", company: "Boeing Company", market: "US", exchange: "NYSE", sector: "Industrials", currency: "USD", price: 204.6, change: -1.04, volume: 3240000, marketCap: "125B", history: [209,208,207,206,206,205,205] }

  ,{ symbol: "ZOMATO", company: "Eternal Limited (Zomato)", market: "IN", exchange: "NSE", sector: "Consumer", currency: "INR", price: 282.4, change: 1.36, volume: 6842000, marketCap: "2.7T", history: [275,277,276,279,280,281,282] }
  ,{ symbol: "TRENT", company: "Trent Limited", market: "IN", exchange: "NSE", sector: "Consumer", currency: "INR", price: 6128.5, change: -0.62, volume: 324500, marketCap: "2.2T", history: [6200,6180,6160,6170,6150,6140,6129] }
  ,{ symbol: "TECHM", company: "Tech Mahindra", market: "IN", exchange: "NSE", sector: "Technology", currency: "INR", price: 1542.2, change: 0.47, volume: 724300, marketCap: "1.5T", history: [1520,1525,1530,1528,1535,1539,1542] }
  ,{ symbol: "JSWSTEEL", company: "JSW Steel", market: "IN", exchange: "NSE", sector: "Materials", currency: "INR", price: 1084.6, change: 0.88, volume: 1324000, marketCap: "2.7T", history: [1060,1068,1070,1075,1078,1080,1085] }
  ,{ symbol: "GRASIM", company: "Grasim Industries", market: "IN", exchange: "NSE", sector: "Materials", currency: "INR", price: 2788.1, change: -0.31, volume: 432100, marketCap: "1.9T", history: [2800,2798,2795,2790,2794,2791,2788] }
  ,{ symbol: "DRREDDY", company: "Dr. Reddy's Laboratories", market: "IN", exchange: "NSE", sector: "Healthcare", currency: "INR", price: 1248.7, change: 0.54, volume: 582400, marketCap: "1.0T", history: [1230,1234,1238,1236,1240,1245,1249] }
  ,{ symbol: "EICHERMOT", company: "Eicher Motors", market: "IN", exchange: "NSE", sector: "Automotive", currency: "INR", price: 5482.3, change: 1.02, volume: 214500, marketCap: "1.5T", history: [5400,5420,5435,5440,5455,5470,5482] }
  ,{ symbol: "INDUSINDBK", company: "IndusInd Bank", market: "IN", exchange: "NSE", sector: "Financials", currency: "INR", price: 742.6, change: -1.15, volume: 1842000, marketCap: "580B", history: [755,751,748,746,745,744,743] }
  ,{ symbol: "HEROMOTOCO", company: "Hero MotoCorp", market: "IN", exchange: "NSE", sector: "Automotive", currency: "INR", price: 5284.9, change: 0.76, volume: 184300, marketCap: "1.1T", history: [5200,5220,5230,5245,5260,5270,5285] }
  ,{ symbol: "PIDILITIND", company: "Pidilite Industries", market: "IN", exchange: "NSE", sector: "Materials", currency: "INR", price: 2984.2, change: 0.29, volume: 214600, marketCap: "1.5T", history: [2960,2965,2970,2972,2975,2980,2984] }
  ,{ symbol: "ADBE", company: "Adobe Inc.", market: "US", exchange: "NASDAQ", sector: "Technology", currency: "USD", price: 354.2, change: -0.74, volume: 3240000, marketCap: "155B", history: [361,359,357,358,356,355,354] }
  ,{ symbol: "IBM", company: "International Business Machines", market: "US", exchange: "NYSE", sector: "Technology", currency: "USD", price: 284.6, change: 0.57, volume: 3120000, marketCap: "265B", history: [280,281,282,282,283,284,285] }
  ,{ symbol: "GS", company: "Goldman Sachs Group", market: "US", exchange: "NYSE", sector: "Financials", currency: "USD", price: 742.5, change: 0.64, volume: 1820000, marketCap: "230B", history: [732,735,737,738,740,741,743] }
  ,{ symbol: "WFC", company: "Wells Fargo & Company", market: "US", exchange: "NYSE", sector: "Financials", currency: "USD", price: 79.3, change: 0.32, volume: 8240000, marketCap: "255B", history: [78.4,78.6,78.7,78.8,79,79.1,79.3] }
  ,{ symbol: "MRK", company: "Merck & Co.", market: "US", exchange: "NYSE", sector: "Healthcare", currency: "USD", price: 91.4, change: -0.22, volume: 6820000, marketCap: "230B", history: [92,91.8,91.7,91.6,91.5,91.5,91.4] }
  ,{ symbol: "ABBV", company: "AbbVie Inc.", market: "US", exchange: "NYSE", sector: "Healthcare", currency: "USD", price: 221.8, change: 0.81, volume: 5240000, marketCap: "390B", history: [218,219,219.5,220,220.5,221,222] }
  ,{ symbol: "TMO", company: "Thermo Fisher Scientific", market: "US", exchange: "NYSE", sector: "Healthcare", currency: "USD", price: 468.2, change: 0.27, volume: 1480000, marketCap: "180B", history: [464,465,466,466,467,468,468] }
  ,{ symbol: "NKE", company: "Nike, Inc.", market: "US", exchange: "NYSE", sector: "Consumer", currency: "USD", price: 72.8, change: -0.48, volume: 8420000, marketCap: "108B", history: [74,73.8,73.5,73.2,73,72.9,72.8] }
  ,{ symbol: "HD", company: "The Home Depot", market: "US", exchange: "NYSE", sector: "Consumer", currency: "USD", price: 386.5, change: 0.43, volume: 2480000, marketCap: "385B", history: [382,383,384,384,385,386,387] }
  ,{ symbol: "PM", company: "Philip Morris International", market: "US", exchange: "NYSE", sector: "Consumer", currency: "USD", price: 160.4, change: 0.66, volume: 2840000, marketCap: "250B", history: [157,158,158.5,159,159.5,160,160] }
  ,{ symbol: "NOW", company: "ServiceNow, Inc.", market: "US", exchange: "NYSE", sector: "Technology", currency: "USD", price: 918.6, change: 1.09, volume: 1240000, marketCap: "190B", history: [900,904,908,910,913,916,919] }
  ,{ symbol: "TXN", company: "Texas Instruments", market: "US", exchange: "NASDAQ", sector: "Semiconductors", currency: "USD", price: 186.2, change: -0.36, volume: 3840000, marketCap: "170B", history: [188,187.5,187,186.8,186.5,186.3,186.2] }
  ,{ symbol: "AMAT", company: "Applied Materials", market: "US", exchange: "NASDAQ", sector: "Semiconductors", currency: "USD", price: 226.4, change: 1.48, volume: 3240000, marketCap: "185B", history: [220,221,222,223,224,225,226] }
  ,{ symbol: "PANW", company: "Palo Alto Networks", market: "US", exchange: "NASDAQ", sector: "Technology", currency: "USD", price: 198.6, change: 0.94, volume: 2840000, marketCap: "132B", history: [193,194,195,196,197,198,199] }
  ,{ symbol: "LIN", company: "Linde plc", market: "US", exchange: "NASDAQ", sector: "Materials", currency: "USD", price: 462.8, change: 0.38, volume: 1640000, marketCap: "220B", history: [458,459,460,460,461,462,463] }
];

// Synthetic records make it possible to exercise search, sorting and filtering at scale.
// They are intentionally named SIM* and must never be presented as real listed securities.
const sectors = ["Technology", "Financials", "Healthcare", "Energy", "Consumer", "Industrials", "Semiconductors", "Materials", "Utilities", "Communication", "Automotive", "Telecom"];
const round = (value, digits = 2) => Number(value.toFixed(digits));
const makeIllustrativeHistory = (price, index, length = 60) => Array.from({ length }, (_, step) => {
  const trend = 0.86 + (step / Math.max(1, length - 1)) * 0.14;
  const wave = Math.sin((index + step) * 0.71) * 0.012 + Math.cos((index + step) * 0.19) * 0.006;
  return round(price * (trend + wave));
});

function enrichStock(stock, index) {
  const price = Number(stock.price) || 100;
  const change = Number(stock.change) || 0;
  const volume = Number(stock.volume) || 100000;
  const capBase = price * volume * (8 + (index % 19));
  return {
    ...stock,
    history: makeIllustrativeHistory(price, index),
    marketCapValue: Number(stock.marketCapValue) || capBase,
    peRatio: round(8 + ((index * 7) % 420) / 10),
    priceToBook: round(0.5 + ((index * 11) % 90) / 10),
    eps: round(price / Math.max(1, 8 + ((index * 3) % 40)), 2),
    dividendYield: round((index * 13) % 75 / 10, 2),
    beta: round(0.55 + ((index * 17) % 140) / 100, 2),
    high52: round(price * (1.05 + (index % 20) / 100)),
    low52: round(price * (0.55 + (index % 25) / 100)),
    avgVolume: Math.round(volume * (0.7 + (index % 7) / 10)),
    revenueGrowth: round(-12 + ((index * 5) % 410) / 10),
    profitMargin: round(-8 + ((index * 9) % 330) / 10),
    debtToEquity: round(((index * 13) % 180) / 10),
    rsi: round(20 + ((index * 7) % 600) / 10),
    sma20: round(price * (0.94 + (index % 13) / 100)),
    sma50: round(price * (0.9 + (index % 17) / 100)),
    ema20: round(price * (0.95 + (index % 11) / 100)),
    volatility: round(0.5 + ((index * 3) % 150) / 10),
    roe: round(-5 + ((index * 19) % 350) / 10),
    roa: round(-3 + ((index * 23) % 180) / 10),
    currentRatio: round(0.5 + ((index * 7) % 350) / 100),
    grossMargin: round(5 + ((index * 11) % 700) / 10),
    operatingMargin: round(-5 + ((index * 13) % 450) / 10),
    freeCashFlow: Math.round((price * volume * (((index % 9) - 3) / 1000))),
    institutionalOwnership: round((index * 17) % 950 / 10),
    shortInterest: round((index * 19) % 250 / 10),
    dayHigh: round(price * (1 + Math.abs(change) / 500 + 0.004)),
    dayLow: round(price * (1 - Math.abs(change) / 500 - 0.004)),
    open: round(price * (1 - change / 100)),
    previousClose: round(price / (1 + change / 100 || 1)),
    floatShares: Math.round(volume * (10 + index % 100)),
    dataSource: stock.dataSource || "Demo dataset",
  };
}

const enrichedSeeds = seedStocks.map((stock, index) => enrichStock(stock, index));
const SIMULATED_UNIVERSE_SIZE = 5000;
const syntheticCount = Math.max(0, SIMULATED_UNIVERSE_SIZE - enrichedSeeds.length);
const syntheticStocks = Array.from({ length: syntheticCount }, (_, index) => {
  const id = index + 1;
  const market = index % 2 === 0 ? "IN" : "US";
  const currency = market === "IN" ? "INR" : "USD";
  const price = round(market === "IN" ? 45 + ((id * 137) % 24000) : 8 + ((id * 29) % 1800));
  const change = round(-7.5 + ((id * 37) % 150) / 10);
  const volume = 12000 + ((id * 7919) % (market === "IN" ? 12000000 : 90000000));
  const symbol = `${market === "IN" ? "SIMI" : "SIMU"}${String(id).padStart(5, "0")}`;
  const stock = {
    symbol,
    company: `Simulation Equity ${String(id).padStart(5, "0")}`,
    market,
    exchange: market === "IN" ? "NSE (simulated)" : "NASDAQ (simulated)",
    sector: sectors[id % sectors.length],
    currency,
    price,
    change,
    volume,
    marketCap: "Demo",
    history: Array.from({ length: 7 }, (_, step) => round(price * (0.94 + step * 0.01 + Math.sin((id + step) * 0.7) * 0.008))),
    isSynthetic: true,
    dataSource: "Synthetic performance-test data",
  };
  return enrichStock(stock, id + enrichedSeeds.length);
});

export const initialStocks = [...enrichedSeeds, ...syntheticStocks];
export const marketLabels = { IN: "India", US: "United States" };
export const syntheticUniverseSize = syntheticStocks.length;
