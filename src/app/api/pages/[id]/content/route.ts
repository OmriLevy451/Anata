import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyPatches } from "@/server/utils/applyPatches";
import type { Patch } from "@/core/domain/patches";

// UPDATE: params is now a Promise<{ id: string }>
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  // FIX: Await the params before accessing properties
  const { id: pageId } = await params;
  
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

  const nextContent = applyPatches((page.content as any) ?? {}, patches);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.page.update({
      where: { id: pageId },
      data: { content: nextContent as any, version: { increment: 1 } },
      select: { id: true, version: true, content: true },
    });
    await tx.operation.create({
      data: { pageId, userId: userId ?? null, patches: patches as any }
    });
    return updated;
  });

  return NextResponse.json(result, { status: 200 });
}