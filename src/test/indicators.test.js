import { describe, expect, it } from "vitest";
import {
  calculateBollinger,
  calculateEMA,
  calculateRSI,
  calculateSMA,
  calculateVolumeProfile,
} from "../utils/indicators.js";

describe("technical indicator calculations", () => {
  it("calculates SMA with null values before the period is available", () => {
    expect(calculateSMA([10, 12, 14, 16, 18], 3)).toEqual([
      null,
      null,
      12,
      14,
      16,
    ]);
  });

  it("seeds EMA with the first period SMA", () => {
    expect(calculateEMA([10, 12, 14, 16], 3)).toEqual([null, null, 12, 14]);
  });

  it("calculates ordered Bollinger bands", () => {
    const bands = calculateBollinger([10, 11, 12, 13], 3);
    expect(bands[0].middle).toBeNull();
    expect(bands[3].upper).toBeGreaterThan(bands[3].middle);
    expect(bands[3].lower).toBeLessThan(bands[3].middle);
  });

  it("keeps RSI between 0 and 100", () => {
    const rsi = calculateRSI(
      Array.from({ length: 20 }, (_, i) => 100 + i),
      14,
    ).filter(Number.isFinite);
    expect(rsi.length).toBe(6);
    expect(rsi.every((value) => value >= 0 && value <= 100)).toBe(true);
    expect(rsi.at(-1)).toBe(100);
  });

  it("aggregates candle volume into the requested number of buckets", () => {
    const profile = calculateVolumeProfile(
      [
        { low: 10, high: 12, volume: 100 },
        { low: 12, high: 15, volume: 200 },
      ],
      5,
    );
    expect(profile).toHaveLength(5);
    expect(profile.reduce((sum, bucket) => sum + bucket.volume, 0)).toBeCloseTo(
      300,
      8,
    );
  });
});
