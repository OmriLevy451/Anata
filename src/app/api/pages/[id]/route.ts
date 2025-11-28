import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper type for Next.js 15 params
type Props = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Props) {
  const { id } = await params; // Fix
  const page = await prisma.page.findUnique({
    where: { id },
    select: { id: true, boardId: true, name: true, width: true, height: true, content: true, version: true, updatedAt: true }
  });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function DELETE(_: Request, { params }: Props) {
  const { id } = await params; // Fix
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
   
  await prisma.page.delete({ where: { id } });
  return NextResponse.json({ message: "Page deleted" }, { status: 200 });
}

export async function PATCH(req: Request, { params }: Props) {
  const { id } = await params; // Fix
  const body = await req.json();
  const { name, width, height, content } = body;
   
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updatedPage = await prisma.page.update({
    where: { id },
    data: {
      name: name ?? page.name,
      width: width ?? page.width,
      height: height ?? page.height,
      content: content ?? page.content,
      version: page.version + 1,
    },
    select: { id: true, boardId: true, name: true, width: true, height: true, content: true, version: true, updatedAt: true }
  });
   
  return NextResponse.json(updatedPage);
}