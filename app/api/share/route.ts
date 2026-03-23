import { NextRequest, NextResponse } from "next/server";
import { savePacket, getPacket } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.signalPacket) {
    return NextResponse.json({ error: "Missing signalPacket" }, { status: 400 });
  }

  const id = savePacket({
    signalPacket: body.signalPacket,
    sources: body.sources || [],
    generatedAt: body.generatedAt || new Date().toISOString(),
  });

  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const data = getPacket(id);

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
