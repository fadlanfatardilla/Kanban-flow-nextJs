import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET: Mengambil seluruh komentar untuk task tertentu
export async function GET(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { taskId } = await context.params

    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" }, // Komentar terbaru muncul paling atas
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    return NextResponse.json(comments, { status: 200 })
  } catch (error: any) {
    console.error("Error GET comments:", error)
    return NextResponse.json(
      { message: "Gagal memuat komentar", error: error.message },
      { status: 500 }
    )
  }
}

// POST: Menambahkan komentar baru ke task
export async function POST(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { taskId } = await context.params
    const { content } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ message: "Komentar tidak boleh kosong" }, { status: 400 })
    }

    // Cari user berdasarkan email session NextAuth
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 })
    }

    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId,
        userId: currentUser.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    return NextResponse.json(newComment, { status: 201 })
  } catch (error: any) {
    console.error("Error POST comment:", error)
    return NextResponse.json(
      { message: "Gagal menambahkan komentar", error: error.message },
      { status: 500 }
    )
  }
}