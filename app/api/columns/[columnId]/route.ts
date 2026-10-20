import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// PUT: Edit nama kolom
export async function PUT(
  req: Request,
  context: { params: Promise<{ columnId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { columnId } = await context.params
    const { title } = await req.json()

    if (!title) {
      return NextResponse.json({ message: "Judul kolom wajib diisi" }, { status: 400 })
    }

    const updatedColumn = await prisma.column.update({
      where: { id: columnId },
      data: { title },
    })

    return NextResponse.json(updatedColumn, { status: 200 })
  } catch (error: any) {
    console.error("Error PUT column:", error)
    return NextResponse.json({ message: "Gagal memperbarui kolom", error: error.message }, { status: 500 })
  }
}

// DELETE: Hapus kolom beserta tugas di dalamnya
export async function DELETE(
  req: Request,
  context: { params: Promise<{ columnId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { columnId } = await context.params

    // Hapus tugas-tugas di dalam kolom terlebih dahulu (jika relasi database tidak cascade otomatis)
    await prisma.task.deleteMany({
      where: { columnId },
    })

    // Hapus kolom
    await prisma.column.delete({
      where: { id: columnId },
    })

    return NextResponse.json({ message: "Kolom berhasil dihapus" }, { status: 200 })
  } catch (error: any) {
    console.error("Error DELETE column:", error)
    return NextResponse.json({ message: "Gagal menghapus kolom", error: error.message }, { status: 500 })
  }
}