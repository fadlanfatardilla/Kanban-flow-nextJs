import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET: Ambil semua board dalam workspace ini
export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { workspaceId } = await params

    const boards = await prisma.board.findMany({
      where: { workspaceId },
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(boards)
  } catch (error) {
    console.error("Error GET boards:", error)
    return NextResponse.json({ message: "Gagal mengambil daftar papan", error }, { status: 500 })
  }
}

// POST: Buat board baru beserta 3 kolom default (To Do, In Progress, Done)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { workspaceId } = await params
    const { title } = await req.json()

    if (!title) {
      return NextResponse.json({ message: "Judul papan wajib diisi" }, { status: 400 })
    }

    // Buat board sekaligus 3 kolom awal secara otomatis
    const board = await prisma.board.create({
      data: {
        title,
        workspaceId,
        columns: {
          create: [
            { title: "To Do", order: 1 },
            { title: "In Progress", order: 2 },
            { title: "Done", order: 3 },
          ],
        },
      },
      include: {
        columns: true,
      },
    })

    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    console.error("Error POST board:", error)
    return NextResponse.json({ message: "Gagal membuat papan baru", error }, { status: 500 })
  }
}