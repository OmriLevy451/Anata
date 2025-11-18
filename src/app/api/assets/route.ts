export const runtime = "nodejs"; // prisma isn't edge-compatible

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const boardId = form.get("boardId") as string | null;

  if (!file || !boardId) {
    return NextResponse.json({ error: "file and boardId are required" }, { status: 400 });
  }

  // In production: stream to S3/GCS and get a URL
  const arrayBuf = await file.arrayBuffer();
  const bytes = arrayBuf.byteLength;
  const fakeUrl = `/uploads/${crypto.randomUUID()}-${file.name}`; // placeholder

  const asset = await prisma.asset.create({
    data: { boardId, url: fakeUrl, kind: "image", bytes },
    select: { id: true, url: true, bytes: true, createdAt: true }
  });

  return NextResponse.json(asset, { status: 201 });
}
