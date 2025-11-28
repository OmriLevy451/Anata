import BoardCanvas from "@/components/BoardCanvas";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch the board to get the first page ID
  // In a real app, you might have a sidebar to switch pages
  const board = await prisma.board.findUnique({
    where: { id },
    include: { pages: true } // We need to know which page to load
  });

  if (!board) return <div>Board not found</div>;

  const firstPage = board.pages[0];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-blue-600 hover:underline mb-2 block">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold">{board.title}</h1>
          <p className="text-gray-500 text-sm">Owner ID: {board.ownerId}</p>
        </div>
      </div>

      {firstPage ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Page: {firstPage.name}</h2>
          <BoardCanvas pageId={firstPage.id} />
        </div>
      ) : (
        <div className="p-10 border-2 border-dashed rounded text-gray-400">
          This board has no pages yet.
        </div>
      )}
    </div>
  );
}