"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper untuk generate token acak jika belum ada
function generateToken() {
  return globalThis.crypto.randomUUID();
}

// 1. Action untuk Update PIN, Expiration, dan Status Link
export async function updateWorkspaceInviteSettings({
  workspaceId,
  pin,
  expiresInDays,
  isLinkActive,
}: {
  workspaceId: string;
  pin?: string;
  expiresInDays?: number | null;
  isLinkActive?: boolean;
}) {
  try {
    let pinExpiresAt: Date | null = null;

    if (expiresInDays) {
      pinExpiresAt = new Date();
      pinExpiresAt.setDate(pinExpiresAt.getDate() + expiresInDays);
    }

    // 1. Cek apakah workspace sudah memiliki inviteToken
    const currentWorkspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { inviteToken: true },
    });

    // 2. Jika inviteToken masih kosong, buatkan token baru secara otomatis
    const inviteTokenToSet = currentWorkspace?.inviteToken || generateToken();

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        inviteToken: inviteTokenToSet,
        ...(pin !== undefined && { invitePin: pin || null }),
        ...(expiresInDays !== undefined && { pinExpiresAt }),
        ...(isLinkActive !== undefined && { isInviteLinkActive: isLinkActive ?? true }),
      },
    });

    revalidatePath(`/workspace/${workspaceId}`);
    return { success: true, data: updatedWorkspace };
  } catch (error) {
    console.error("Error updating invite settings:", error);
    return { success: false, error: "Gagal memperbarui pengaturan undangan." };
  }
}

// 2. Action untuk Reset / Regenerate Token URL Undangan
export async function regenerateInviteToken(workspaceId: string) {
  try {
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        inviteToken: generateToken(),
      },
    });

    revalidatePath(`/workspace/${workspaceId}`);
    return { success: true, inviteToken: updatedWorkspace.inviteToken };
  } catch (error) {
    console.error("Error regenerating invite token:", error);
    return { success: false, error: "Gagal mereset tautan undangan." };
  }
}


// 3. Action untuk User Join Workspace via Link & PIN
// 3. Action untuk User Join Workspace via Link & PIN
export async function joinWorkspaceViaLink({
  token,
  userId,
  inputPin,
}: {
  token: string;
  userId: string;
  inputPin?: string;
}) {
  try {
    if (!token || !token.trim()) {
      return { success: false, error: "Tautan undangan tidak boleh kosong." };
    }

    if (!userId || !userId.trim()) {
      return { 
        success: false, 
        error: "Sesi pengguna tidak terdeteksi. Silakan muat ulang halaman atau login kembali." 
      };
    }

    // Cari user di database berdasarkan ID, email, atau nama
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: userId },
        ],
      },
    });

    if (!user && userId.includes("@")) {
      user = await prisma.user.findUnique({
        where: { email: userId },
      });
    }

    if (!user) {
      return { 
        success: false, 
        error: `Akun dengan identitas "${userId}" tidak ditemukan di tabel User database. Pastikan akun sudah terdaftar.` 
      };
    }

    const targetUserId = user.id;

    const workspace = await prisma.workspace.findUnique({
      where: { inviteToken: token.trim() },
      include: { members: true },
    });

    if (!workspace) {
      return { success: false, error: "Tautan undangan tidak ditemukan atau tidak valid." };
    }

    if (workspace.isInviteLinkActive === false) {
      return { success: false, error: "Tautan undangan ini sedang dinonaktifkan oleh Owner." };
    }

    const isAlreadyMember = workspace.members.some((m) => m.userId === targetUserId);
    if (isAlreadyMember) {
      return { success: true, workspaceId: workspace.id, message: "Anda sudah menjadi anggota workspace ini." };
    }

    if (workspace.invitePin) {
      if (workspace.pinExpiresAt && new Date() > workspace.pinExpiresAt) {
        return { success: false, error: "Kode PIN undangan ini sudah kedaluwarsa. Minta PIN baru kepada Owner." };
      }

      if (!inputPin || inputPin.trim() !== workspace.invitePin.trim()) {
        return { success: false, error: "Kode PIN yang Anda masukkan salah." };
      }
    }

    await prisma.workspaceMember.create({
      data: {
        userId: targetUserId,
        workspaceId: workspace.id,
        role: "MEMBER",
      },
    });

    revalidatePath(`/workspace/${workspace.id}`);
    return { success: true, workspaceId: workspace.id, message: "Berhasil bergabung ke workspace!" };
  } catch (error: any) {
    console.error("Error detail saat join workspace:", error?.message || error);
    return { success: false, error: `Terjadi kesalahan sistem: ${error?.message || "Gagal memproses"}` };
  }
}