
import { describe, expect, it } from "vitest";
import { calculateVolumeProfile } from "../utils/indicators.js";

describe("calculateVolumeProfile", () => {
  it("creates the requested number of price buckets", () => {
    const candles = [
      { low: 10, high: 20, volume: 100 },
      { low: 15, high: 25, volume: 60 },
    ];

    const profile = calculateVolumeProfile(candles, 5);

    expect(profile).toHaveLength(5);
  });

  it("preserves total volume across buckets", () => {
    const candles = [
      { low: 10, high: 20, volume: 100 },
      { low: 15, high: 25, volume: 60 },
    ];

    const profile = calculateVolumeProfile(candles, 5);

    const totalProfileVolume = profile.reduce(
      (total, bucket) => total + bucket.volume,
      0
    );

    expect(totalProfileVolume).toBeCloseTo(160);
  });

  it("returns an empty profile for empty input", () => {
    expect(calculateVolumeProfile([], 12)).toEqual([]);
  });

  it("rejects an invalid bucket count", () => {
    expect(() => calculateVolumeProfile([], 0)).toThrow(
      RangeError
    );
  });
});
