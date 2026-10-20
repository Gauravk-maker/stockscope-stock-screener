
import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { makeQueryClient } from "../lib/query-client";

describe("makeQueryClient", () => {
  it("returns a QueryClient instance", () => {
    const client = makeQueryClient();

    expect(client).toBeInstanceOf(QueryClient);
    client.clear();
  });

  it("creates a fresh client on each call", () => {
    const first = makeQueryClient();
    const second = makeQueryClient();

    expect(first).not.toBe(second);

    first.clear();
    second.clear();
  });

  it("sets the expected default query options", () => {
    const client = makeQueryClient();
    const options = client.getDefaultOptions();

    expect(options.queries?.staleTime).toBe(15_000);
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
    expect(options.queries?.retry).toBe(1);

    client.clear();
  });
});
