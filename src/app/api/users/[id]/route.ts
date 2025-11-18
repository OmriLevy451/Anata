import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/users/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise, so we must await it
    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Invalid or missing user ID" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        boardsOwned: true,
        collaborations: true,
        operations: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error(`Error fetching user: ${error.message}`);
    if (error.code === "P2023") {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params here too
    const { id } = await params;
    const data = await request.json();

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Invalid or missing user ID" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error(`Error updating user: ${error.message}`);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params here too
    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Invalid or missing user ID" },
        { status: 400 }
      );
    }

    const deletedUser = await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json(deletedUser);
  } catch (error: any) {
    console.error(`Error deleting user: ${error.message}`);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}