import { NextResponse } from "next/server";

/** Reports whether TYPESAFE_API_KEY is configured on the server. Never returns the key itself. */
export async function GET() {
  const keyPresent = Boolean(process.env.TYPESAFE_API_KEY?.trim());
  return NextResponse.json({ jevEnabled: keyPresent });
}
