import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> } // Params berupa Promise di Next.js 15+
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    // WAJIB: await params untuk mendapatkan workspaceId
    const { workspaceId } = await params

    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace ID tidak valid" }, { status: 400 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        boards: true,
      },
    })

    if (!workspace) {
      return NextResponse.json({ message: "Workspace tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(workspace, { status: 200 })
  } catch (error) {
    console.error("Error fetching workspace detail:", error)
    return NextResponse.json({ message: "Gagal mengambil detail workspace", error }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { workspaceId } = await params

    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace ID tidak valid" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 })
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: user.id,
        role: "OWNER",
      },
    })

    if (!member) {
      return NextResponse.json(
        { message: "Hanya Owner yang berhak menghapus workspace ini." },
        { status: 403 }
      )
    }

    await prisma.workspace.delete({
      where: { id: workspaceId },
    })

    return NextResponse.json(
      { message: "Workspace berhasil dihapus!" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Gagal menghapus workspace:", error)
    return NextResponse.json(
      { message: "Gagal menghapus workspace", error: error?.message || error },
      { status: 500 }
    )
  }
}