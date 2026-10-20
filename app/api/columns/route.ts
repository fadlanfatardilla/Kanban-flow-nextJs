import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// POST: Tambah kolom baru ke board
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { title, boardId } = await req.json()

    if (!title || !boardId) {
      return NextResponse.json({ message: "Judul kolom dan boardId wajib diisi" }, { status: 400 })
    }

    // Hitung jumlah kolom yang sudah ada untuk menentukan order
    const columnCount = await prisma.column.count({
      where: { boardId },
    })

    const newColumn = await prisma.column.create({
      data: {
        title,
        boardId,
        order: columnCount + 1,
      },
    })

    return NextResponse.json(newColumn, { status: 201 })
  } catch (error: any) {
    console.error("Error POST column:", error)
    return NextResponse.json({ message: "Gagal membuat kolom", error: error.message }, { status: 500 })
  }
}