const validPeriod = (period) => Number.isInteger(period) && period > 0;

export function calculateSMA(values, period = 20) {
  if (!validPeriod(period)) throw new RangeError("period must be a positive integer");
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    const window = values.slice(index - period + 1, index + 1).map(Number);
    if (window.some(value => !Number.isFinite(value))) return null;
    return window.reduce((sum, value) => sum + value, 0) / period;
  });
}

export function calculateEMA(values, period = 12) {
  if (!validPeriod(period)) throw new RangeError("period must be a positive integer");
  const output = Array(values.length).fill(null);
  if (values.length < period) return output;
  const seed = values.slice(0, period).map(Number);
  if (seed.some(value => !Number.isFinite(value))) return output;
  let ema = seed.reduce((sum, value) => sum + value, 0) / period;
  output[period - 1] = ema;
  const multiplier = 2 / (period + 1);
  for (let i = period; i < values.length; i += 1) {
    const price = Number(values[i]);
    if (!Number.isFinite(price)) { output[i] = null; continue; }
    ema = (price - ema) * multiplier + ema;
    output[i] = ema;
  }
  return output;
}

export function calculateBollinger(values, period = 20, deviations = 2) {
  if (!validPeriod(period) || !Number.isFinite(deviations) || deviations < 0) throw new RangeError("invalid Bollinger parameters");
  const middle = calculateSMA(values, period);
  return values.map((_, index) => {
    if (middle[index] == null) return { middle: null, upper: null, lower: null };
    const window = values.slice(index - period + 1, index + 1).map(Number);
    const variance = window.reduce((sum, value) => sum + (value - middle[index]) ** 2, 0) / period;
    const deviation = Math.sqrt(variance);
    return { middle: middle[index], upper: middle[index] + deviations * deviation, lower: middle[index] - deviations * deviation };
  });
}

export function calculateRSI(values, period = 14) {
  if (!validPeriod(period)) throw new RangeError("period must be a positive integer");
  const output = Array(values.length).fill(null);
  if (values.length <= period) return output;
  let gains = 0; let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const delta = Number(values[i]) - Number(values[i - 1]);
    if (!Number.isFinite(delta)) return output;
    gains += Math.max(delta, 0); losses += Math.max(-delta, 0);
  }
  let averageGain = gains / period;
  let averageLoss = losses / period;
  const toRsi = (gain, loss) => loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
  output[period] = toRsi(averageGain, averageLoss);
  for (let i = period + 1; i < values.length; i += 1) {
    const delta = Number(values[i]) - Number(values[i - 1]);
    if (!Number.isFinite(delta)) { output[i] = null; continue; }
    averageGain = (averageGain * (period - 1) + Math.max(delta, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-delta, 0)) / period;
    output[i] = toRsi(averageGain, averageLoss);
  }
  return output;
}


export function calculateVolumeProfile(candles, bucketCount = 12) {
  if (!validPeriod(bucketCount)) {
    throw new RangeError(
      "bucketCount must be a positive integer"
    );
  }

  if (!Array.isArray(candles) || candles.length === 0) {
    return [];
  }

  const validCandles = candles.filter((candle) => {
    const low = Number(candle.low);
    const high = Number(candle.high);
    const volume = Number(candle.volume);

    return (
      Number.isFinite(low) &&
      Number.isFinite(high) &&
      low > 0 &&
      high >= low &&
      Number.isFinite(volume) &&
      volume >= 0
    );
  });

  if (validCandles.length === 0) {
    return [];
  }

  const observedLow = Math.min(
    ...validCandles.map((candle) => Number(candle.low))
  );

  const observedHigh = Math.max(
    ...validCandles.map((candle) => Number(candle.high))
  );

  // Avoid zero-width price buckets when every candle has
  // the same high and low.
  const step =
    observedHigh === observedLow
      ? Math.max(Math.abs(observedLow) * 0.0001, 0.01)
      : (observedHigh - observedLow) / bucketCount;

  const profileLow =
    observedHigh === observedLow
      ? observedLow - (step * bucketCount) / 2
      : observedLow;

  const buckets = Array.from(
    { length: bucketCount },
    (_, index) => ({
      price: profileLow + step * (index + 0.5),
      volume: 0,
    })
  );

  for (const candle of validCandles) {
    const candleLow = Number(candle.low);
    const candleHigh = Number(candle.high);
    const candleVolume = Number(candle.volume);

    const firstBucket = Math.max(
      0,
      Math.min(
        bucketCount - 1,
        Math.floor((candleLow - profileLow) / step)
      )
    );

    const lastBucket = Math.max(
      0,
      Math.min(
        bucketCount - 1,
        Math.floor((candleHigh - profileLow) / step)
      )
    );

    const bucketsTouched = lastBucket - firstBucket + 1;

    // OHLCV data does not contain actual trade-by-price
    // information, so distribute volume evenly over the
    // buckets touched by each candle's price range.
    const volumePerBucket =
      candleVolume / bucketsTouched;

    for (
      let index = firstBucket;
      index <= lastBucket;
      index += 1
    ) {
      buckets[index].volume += volumePerBucket;
    }
  }

  return buckets;
}
