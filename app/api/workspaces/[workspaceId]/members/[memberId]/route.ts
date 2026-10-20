import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;
    const { role: targetNewRole } = await req.json();

    if (!["OWNER", "ADMIN", "MEMBER"].includes(targetNewRole)) {
      return NextResponse.json({ message: "Role tidak valid." }, { status: 400 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User tidak ditemukan." }, { status: 404 });
    }

    // 2. Ambil data membership dari user yang sedang login di workspace ini
    const currentMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: currentUser.id,
      },
    });

    if (!currentMember) {
      return NextResponse.json(
        { message: "Anda bukan anggota workspace ini." },
        { status: 403 }
      );
    }

    // 3. ATURAN KEAMANAN UTAMA:
    // - Jika mencoba mengubah role menjadi "OWNER", yang melakukan aksi WAJIB berstatus "OWNER".
    //   (Admin atau Member biasa tidak boleh mengangkat orang lain / diri sendiri jadi OWNER).
    if (targetNewRole === "OWNER" && currentMember.role !== "OWNER") {
      return NextResponse.json(
        { message: "Hanya Owner workspace yang dapat memberikan hak akses Owner." },
        { status: 403 }
      );
    }

    if (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Anda tidak memiliki izin untuk mengubah peran anggota." },
        { status: 403 }
      );
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: {
        id: memberId,
      },
      data: {
        role: targetNewRole,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(updatedMember, { status: 200 });
  } catch (error: any) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server.", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Keluarkan anggota dari workspace (Khusus OWNER)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;

    // 1. Cari user yang sedang login
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User tidak ditemukan." }, { status: 404 });
    }

    // 2. Cek role user yang sedang melakukan aksi di workspace ini
    const currentMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: currentUser.id,
      },
    });

    // ATURAN KEAMANAN: Hanya OWNER yang boleh mengeluarkan anggota
    if (!currentMember || currentMember.role !== "OWNER") {
      return NextResponse.json(
        { message: "Hanya Owner workspace yang diizinkan mengeluarkan anggota." },
        { status: 403 }
      );
    }

    // 3. Pastikan member target yang ingin dihapus memang ada
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember) {
      return NextResponse.json({ message: "Anggota tidak ditemukan." }, { status: 404 });
    }

    // Mencegah Owner mengeluarkan dirinya sendiri melalui tombol ini
    if (targetMember.userId === currentUser.id) {
      return NextResponse.json(
        { message: "Anda tidak dapat mengeluarkan diri sendiri sebagai Owner." },
        { status: 400 }
      );
    }

    // 4. Hapus membership dari database
    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "Anggota berhasil dikeluarkan." }, { status: 200 });
  } catch (error: any) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server.", error: error.message },
      { status: 500 }
    );
  }
}