import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: user.id,
        role: "OWNER",
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Hanya Owner yang berhak menghapus workspace ini." },
        { status: 403 }
      );
    }

    // 3. Hapus workspace
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json(
      { message: "Workspace berhasil dihapus!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Gagal menghapus workspace:", error);
    return NextResponse.json(
      { message: "Gagal menghapus workspace", error: error.message },
      { status: 500 }
    );
  }
}