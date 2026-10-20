import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { title, description, columnId, priority, dueDate } = await req.json()

    if (!title || !columnId) {
      return NextResponse.json({ message: "Judul dan kolom wajib diisi" }, { status: 400 })
    }

    // Hitung jumlah task yang ada untuk menentukan urutan (order) terbaru
    const taskCount = await prisma.task.count({
      where: { columnId },
    })

    const task = await prisma.task.create({
      data: {
        title,
        description,
        columnId,
        order: taskCount + 1,
        priority: priority || "MEDIUM", // <-- Simpan pilihan prioritas user
        dueDate: dueDate ? new Date(dueDate) : null, // <-- Simpan tanggal tenggat jika ada
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Error POST task:", error)
    return NextResponse.json({ message: "Gagal membuat tugas", error }, { status: 500 })
  }
}