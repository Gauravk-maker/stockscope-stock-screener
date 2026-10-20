import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TWELVE_DATA_API_KEY in .env.local" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const exchange = searchParams.get("exchange");

  if (!symbol || !/^[a-zA-Z0-9._-]{1,30}$/.test(symbol)) {
    return NextResponse.json(
      { error: "A valid stock symbol is required." },
      { status: 400 }
    );
  }

  const url = new URL("https://api.twelvedata.com/quote");
  url.searchParams.set("symbol", symbol);

  if (exchange) {
    url.searchParams.set("exchange", exchange);
  }

  url.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    const data = await response.json();

    if (
      !response.ok ||
      data.status === "error" ||
      data.code
    ) {
      return NextResponse.json(
        { error: data.message || "Quote provider request failed." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to the quote provider." },
      { status: 502 }
    );
  }
}