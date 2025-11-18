import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { title, ownerId } = await req.json();
  if (!title || !ownerId) {
    return NextResponse.json({ error: "title and ownerId are required" }, { status: 400 });
  }
  const board = await prisma.board.create({
    data: { title, ownerId, pageOrder: [] },
    select: { id: true, title: true, ownerId: true, createdAt: true },
  });
  return NextResponse.json(board, { status: 201 });
}

export async function GET() {
  const boards = await prisma.board.findMany({
    select: { id: true, title: true, ownerId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(boards);
}