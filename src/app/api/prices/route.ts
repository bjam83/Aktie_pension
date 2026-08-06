import { NextResponse, type NextRequest } from "next/server";
import { fetchStooqPrice } from "@/lib/prices/stooq";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "Mangler ticker" }, { status: 400 });

  const quote = await fetchStooqPrice(ticker);
  if (!quote) return NextResponse.json({ error: "Fandt ingen kurs for tickeren" }, { status: 404 });

  return NextResponse.json(quote);
}
