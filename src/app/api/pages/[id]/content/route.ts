import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyPatches } from "@/server/utils/applyPatches";
import type { Patch } from "@/core/domain/patches";

// need to figure out what are the CONTENTS of pages in relation to fabric.

// IMPORTANT: there is a level of abstraction between fabric.js elements and the backend itself.
// The backend does not know about fabric.js, it only knows about a JSON representation of the canvas.
// The frontend is responsible for converting fabric.js elements to/from this JSON representation.


export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const pageId = params.id;
  const { baseVersion, patches, userId } = (await req.json()) as {
    baseVersion: number; patches: Patch[]; userId?: string;
  };

  if (!Number.isInteger(baseVersion) || !Array.isArray(patches) || patches.length === 0) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (baseVersion !== page.version) {
    return NextResponse.json({ error: "Version conflict", version: page.version }, { status: 409 });
  }

  const nextContent = applyPatches(page.content ?? {}, patches);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.page.update({
      where: { id: pageId },
      data: { content: nextContent, version: { increment: 1 } },
      select: { id: true, version: true, content: true },
    });
    await tx.operation.create({
      data: { pageId, userId: userId ?? null, patches }
    });
    return updated;
  });

  return NextResponse.json(result, { status: 200 });
}
