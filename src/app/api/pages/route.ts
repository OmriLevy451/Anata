export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { boardId, name, width = 1920, height = 1080 } = await req.json();
  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  // 1. Define the Default Content Structure
  const defaultLayerId = "layer-1";
  const now = Date.now();

  const initialContent = {
    shapes: {},
    layers: {
      [defaultLayerId]: {
        id: defaultLayerId,
        pageId: "placeholder", // Will be correct in context, technically redundant inside JSON blob
        name: "Layer 1",
        visible: true,
        locked: false,
        objectIds: [], // Empty list of shapes
        createdAt: now,
        updatedAt: now,
      },
    },
  };

  const page = await prisma.$transaction(async (tx) => {
    const created = await tx.page.create({
      data: {
        boardId,
        name: name ?? "Page 1",
        width,
        height,
        // 2. Use the initialContent instead of empty object
        content: initialContent, 
        version: 1,
      },
      select: {
        id: true,
        boardId: true,
        name: true,
        width: true,
        height: true,
        version: true,
        createdAt: true,
      },
    });

    await tx.board.update({
      where: { id: boardId },
      data: { pageOrder: { push: created.id } },
    });

    return created;
  });

  return NextResponse.json(page, { status: 201 });
}

export async function GET(_: NextRequest) {
  const boards = await prisma.board.findMany({
    select: {
      id: true,
      title: true,
      ownerId: true,
      createdAt: true,
      pageOrder: true,
    },
  });
  return NextResponse.json(boards);
}