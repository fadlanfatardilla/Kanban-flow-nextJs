"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { InviteMemberModal } from "@/components/InviteMemberModal";
import Link from "next/link";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  GripVertical,
  Kanban,
  X,
  Pencil,
  Trash2,
  Search,
  Filter,
  CheckSquare,
  MessageSquare,
  UserPlus,
} from "lucide-react";

interface SubTask {
  id: string;
  title: string;
  isDone: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  order: number;
  columnId: string;
  subTasks?: SubTask[];
  dueDate?: string;
  assigneeId?: string;
  assignee?: any;
  comments?: any[];
}

interface Column {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
}

interface Board {
  id: string;
  title: string;
  workspaceId: string;
  columns: Column[];
}

function KanbanBoardContent() {
  const { status } = useSession();
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const currentUserId = (session?.user as any)?.id || session?.user?.email;
  const currentMember = workspaceMembers.find(
    (m: any) => m.user.id === currentUserId || m.user.email === currentUserId,
  );
  const isOwner = currentMember?.role === "OWNER";
  const [workspace, setWorkspace] = useState<any>(null);
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  // State untuk Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorityFilter, setSelectedPriorityFilter] =
    useState<string>("ALL");

  // State untuk Tambah Task Baru & Modal Pembuatan Tugas
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM");
  const [creating, setCreating] = useState(false);

  // State untuk Modal Edit/Detail Task & Sub-task
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // State Sub-task
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [addingSubTask, setAddingSubTask] = useState(false);

  // State Tambah / Edit Kolom
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");
  const [creatingCol, setCreatingCol] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editColTitle, setEditColTitle] = useState("");
  const [updatingCol, setUpdatingCol] = useState(false);
  const [deletingCol, setDeletingCol] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && boardId) {
      fetchBoard();
    }
  }, [status, boardId, router]);

  const fetchBoard = async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}`);
      if (res.ok) {
        const data = await res.json();
        setBoard(data);

        if (data.workspace) {
          setWorkspace(data.workspace);
        }

        if (data.workspace?.members) {
          setWorkspaceMembers(data.workspace.members);
        }
      }
    } catch (error) {
      console.error("Gagal memuat papan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !board?.workspaceId) return;

    setInviting(true);
    try {
      const res = await fetch(`/api/workspaces/${board.workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Berhasil mengundang anggota ke workspace!", "success");
        setInviteEmail("");
        setIsInviteOpen(false);
        fetchBoard();
      } else {
        showToast(data.message || "Gagal mengundang anggota", "error");
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      showToast("Terjadi kesalahan saat mengundang anggota", "error");
    } finally {
      setInviting(false);
    }
  };

  // Fungsi mengambil komentar berdasarkan task ID
  const fetchComments = async (taskId: string) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Gagal memuat komentar:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Fungsi mengirim komentar baru
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const addedComment = await res.json();
        setComments([addedComment, ...comments]);
        setNewComment("");
      } else {
        const errData = await res.json();
        alert(errData.message || "Gagal mengirim komentar.");
      }
    } catch (error) {
      console.error("Gagal mengirim komentar:", error);
    }
  };

  // State untuk Toast Notification modern
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  // Helper function untuk memicu Toast
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const filteredBoard = useMemo(() => {
    if (!board) return null;

    const filteredColumns = board.columns.map((col) => {
      const filteredTasks = col.tasks.filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description &&
            task.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesPriority =
          selectedPriorityFilter === "ALL" ||
          task.priority === selectedPriorityFilter;

        return matchesSearch && matchesPriority;
      });

      return {
        ...col,
        tasks: filteredTasks,
      };
    });

    return {
      ...board,
      columns: filteredColumns,
    };
  }, [board, searchQuery, selectedPriorityFilter]);

  const handleOpenTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditPriority(task.priority);
    setEditAssigneeId(task.assigneeId || "");

    if (task.dueDate) {
      const d = new Date(task.dueDate);
      setEditDueDate(d.toISOString().split("T")[0]);
    } else {
      setEditDueDate("");
    }
    fetchComments(task.id);
  };

  // Handler Sub-task
  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubTaskTitle.trim()) return;

    setAddingSubTask(true);
    try {
      const res = await fetch("/api/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubTaskTitle,
          taskId: selectedTask.id,
        }),
      });

      if (res.ok) {
        setNewSubTaskTitle("");
        fetchBoard();
      }
    } catch (error) {
      console.error("Gagal menambah sub-task:", error);
    } finally {
      setAddingSubTask(false);
    }
  };

  const handleToggleSubTask = async (
    subtaskId: string,
    currentStatus: boolean,
  ) => {
    if (!selectedTask) return;

    const nextStatus = !currentStatus;

    // 1. Update state lokal selectedTask secara instan (Optimistic UI Update)
    const updatedSubTasks = selectedTask.subTasks?.map((sub) =>
      sub.id === subtaskId ? { ...sub, isDone: nextStatus } : sub,
    );

    setSelectedTask({
      ...selectedTask,
      subTasks: updatedSubTasks,
    });

    if (board) {
      const updatedColumns = board.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((task) =>
          task.id === selectedTask.id
            ? { ...task, subTasks: updatedSubTasks }
            : task,
        ),
      }));
      setBoard({ ...board, columns: updatedColumns });
    }

    try {
      // 2. Kirim update ke database
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: nextStatus }),
      });

      if (res.ok) {
        // 3. Sinkronkan dengan server untuk memverifikasi data terbaru
        fetchBoard();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error(
          "Gagal mengupdate status sub-task di server:",
          errData.message || errData.error || res.statusText,
        );
        // Kembalikan ke data server jika gagal
        fetchBoard();
      }
    } catch (error) {
      console.error("Gagal mengubah status sub-task:", error);
      fetchBoard();
    }
  };

  const handleDeleteSubTask = async (subtaskId: string) => {
    try {
      await fetch(`/api/subtasks/${subtaskId}`, {
        method: "DELETE",
      });
      fetchBoard();
    } catch (error) {
      console.error("Gagal menghapus sub-task:", error);
    }
  };

  // Handler Drag and Drop
  const handleOnDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !board) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newColumns = Array.from(board.columns);
    const sourceCol = newColumns.find((col) => col.id === source.droppableId);
    const destCol = newColumns.find(
      (col) => col.id === destination.droppableId,
    );

    if (!sourceCol || !destCol) return;

    const [movedTask] = sourceCol.tasks.splice(source.index, 1);
    movedTask.columnId = destination.droppableId;
    destCol.tasks.splice(destination.index, 0, movedTask);

    setBoard({ ...board, columns: newColumns });

    try {
      await fetch("/api/tasks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: draggableId,
          destinationColumnId: destination.droppableId,
          newOrder: destination.index + 1,
        }),
      });
    } catch (error) {
      console.error("Gagal menyimpan urutan baru:", error);
      fetchBoard();
    }
  };

  // Handler Tambah Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskTitle.trim()) {
      alert("Judul tugas tidak boleh kosong!");
      return;
    }

    if (!activeColumnId) {
      alert("Kolom tujuan tidak ditemukan.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc,
          columnId: activeColumnId,
          priority: taskPriority,
        }),
      });

      if (res.ok) {
        setTaskTitle("");
        setTaskDesc("");
        setTaskPriority("MEDIUM");
        setActiveColumnId(null);
        setIsCreateTaskOpen(false); // Tutup modal setelah berhasil
        fetchBoard();
      } else {
        const errData = await res.json();
        alert(errData.message || "Gagal membuat tugas baru.");
      }
    } catch (error) {
      console.error("Gagal membuat tugas:", error);
      alert("Terjadi kesalahan koneksi saat membuat tugas.");
    } finally {
      setCreating(false);
    }
  };

  // Handler Update Task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editTitle.trim()) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          priority: editPriority,
          dueDate: editDueDate ? editDueDate : null,
          assigneeId: editAssigneeId || null,
        }),
      });

      if (res.ok) {
        setSelectedTask(null);
        fetchBoard();
      } else {
        const errData = await res.json();
        alert(errData.message || "Gagal memperbarui tugas.");
      }
    } catch (error) {
      console.error("Gagal memperbarui tugas:", error);
      alert("Terjadi kesalahan koneksi saat memperbarui tugas.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus tugas "${selectedTask.title}"?`,
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSelectedTask(null);
        fetchBoard();
      } else {
        const errData = await res.json();
        alert(errData.message || "Gagal menghapus tugas.");
      }
    } catch (error) {
      console.error("Gagal menghapus tugas:", error);
      alert("Terjadi kesalahan koneksi saat menghapus tugas.");
    } finally {
      setDeleting(false);
    }
  };

  // Handler Tambah/Update/Delete Kolom
  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnTitle.trim() || !boardId) return;

    setCreatingCol(true);
    try {
      const res = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: columnTitle,
          boardId,
        }),
      });

      if (res.ok) {
        setColumnTitle("");
        setIsAddingColumn(false);
        fetchBoard();
      }
    } catch (error) {
      console.error("Gagal membuat kolom:", error);
    } finally {
      setCreatingCol(false);
    }
  };

  const handleUpdateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumn || !editColTitle.trim()) return;

    setUpdatingCol(true);
    try {
      const res = await fetch(`/api/columns/${editingColumn.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editColTitle }),
      });

      if (res.ok) {
        setEditingColumn(null);
        fetchBoard();
      }
    } catch (error) {
      console.error("Gagal memperbarui kolom:", error);
    } finally {
      setUpdatingCol(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (!editingColumn) return;

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus kolom "${editingColumn.title}" beserta seluruh tugas di dalamnya?`,
    );
    if (!confirmDelete) return;

    setDeletingCol(true);
    try {
      const res = await fetch(`/api/columns/${editingColumn.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEditingColumn(null);
        fetchBoard();
      }
    } catch (error) {
      console.error("Gagal menghapus kolom:", error);
    } finally {
      setDeletingCol(false);
    }
  };

  // Fungsi helper untuk mengecek status tanggal tenggat
  const getDueDateStatus = (dueDateString?: string) => {
    if (!dueDateString) return null;

    const dueDate = new Date(dueDateString);
    const now = new Date();

    // Normalisasi tanggal tanpa memperhitungkan jam
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
    );

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = dueDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    if (diffDays < 0) {
      return {
        text: `Lewat (${formattedDate})`,
        color: "bg-red-500/15 text-red-400 border-red-500/30",
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      return {
        text: "Hari ini",
        color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
        isOverdue: false,
      };
    } else if (diffDays === 1) {
      return {
        text: "Besok",
        color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        isOverdue: false,
      };
    } else {
      return {
        text: formattedDate,
        color: "bg-slate-800/80 text-slate-400 border-slate-700/50",
        isOverdue: false,
      };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="bg-red-500/15 text-red-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-500/30 tracking-wider">
            URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="bg-orange-500/15 text-orange-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-orange-500/30 tracking-wider">
            HIGH
          </span>
        );
      case "LOW":
        return (
          <span className="bg-slate-500/15 text-slate-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-slate-500/30 tracking-wider">
            LOW
          </span>
        );
      default:
        return (
          <span className="bg-indigo-500/15 text-indigo-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30 tracking-wider">
            MEDIUM
          </span>
        );
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="h-9 w-9 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-orange-500/30">
      {/* Light Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-2xl px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <Link
            href={
              board?.workspaceId
                ? `/workspace/${board.workspaceId}`
                : "/dashboard"
            }
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-2xl cursor-pointer transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-indigo-600 shadow-lg shadow-orange-500/25">
              <Kanban className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white flex items-center gap-2">
                {board?.title}
                <Sparkles className="h-4 w-4 text-orange-400 animate-pulse" />
              </h1>
              <p className="text-xs font-medium text-slate-400">
                Papan Kerja Interaktif SaaS
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <Button
            onClick={() => setIsInviteOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl px-4 h-10 text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            <UserPlus className="h-4 w-4" />
            Undang Anggota
          </Button>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-10 pl-10 pr-4 text-xs w-full"
            />
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 text-slate-300 rounded-2xl h-10 pl-9 pr-5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">
                Semua Prioritas
              </option>
              <option value="LOW" className="bg-slate-900 text-slate-300">
                LOW
              </option>
              <option value="MEDIUM" className="bg-slate-900 text-indigo-400">
                MEDIUM
              </option>
              <option value="HIGH" className="bg-slate-900 text-orange-400">
                HIGH
              </option>
              <option value="URGENT" className="bg-slate-900 text-red-400">
                URGENT
              </option>
            </select>
          </div>

          <Button
            onClick={() => setIsAddingColumn(true)}
            className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-bold rounded-2xl px-5 h-10 shadow-lg shadow-orange-500/20 cursor-pointer gap-2 text-xs"
          >
            <Plus className="h-4 w-4" /> Kolom
          </Button>
        </div>
      </header>

      {/* Drag Drop Context */}
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <main className="flex-1 p-8 overflow-x-auto relative z-10">
          <div className="flex gap-7 h-full items-start min-w-max">
            {filteredBoard?.columns?.map((col) => {
              const isToDo = col.title === "To Do";
              const isInProgress = col.title === "In Progress";
              const isDone = col.title === "Done";

              return (
                <div
                  key={col.id}
                  className="w-84 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-3xl p-5 flex flex-col gap-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 relative group/col"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full blur-sm transition-all duration-500 bg-orange-500/40 group-hover/col:w-48 group-hover/col:bg-orange-500/70" />

                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1 pt-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl border transition-all bg-slate-800/60 border-slate-700/60 text-slate-300">
                        {isToDo ? (
                          <Clock className="h-4 w-4" />
                        ) : isInProgress ? (
                          <Flame className="h-4 w-4 animate-pulse text-orange-400" />
                        ) : isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Kanban className="h-4 w-4 text-indigo-400" />
                        )}
                      </div>
                      <h3
                        onClick={() => {
                          setEditingColumn(col);
                          setEditColTitle(col.title);
                        }}
                        className="font-bold text-base tracking-wide text-slate-100 cursor-pointer hover:text-orange-400 transition-colors"
                        title="Klik untuk edit/hapus kolom"
                      >
                        {col.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-3 py-0.5 rounded-full border shadow-inner bg-slate-800/80 text-slate-300 border-slate-700/50">
                        {col.tasks?.length || 0}
                      </span>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setActiveColumnId(col.id);
                          setIsCreateTaskOpen(true);
                        }}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Droppable Container */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex flex-col gap-3.5 min-h-[220px] p-2 rounded-2xl transition-all duration-300 ${
                          snapshot.isDraggingOver
                            ? "bg-slate-950/80 ring-2 ring-dashed ring-orange-500/40 shadow-inner"
                            : "bg-slate-950/30"
                        }`}
                      >
                        {col.tasks?.map((task, index) => {
                          const totalSub = task.subTasks?.length || 0;
                          const completedSub =
                            task.subTasks?.filter((s) => s.isDone).length || 0;

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleOpenTaskDetail(task)}
                                  className={`group relative rounded-2xl p-[1px] transition-all duration-300 cursor-grab active:cursor-grabbing select-none bg-slate-800/60 hover:bg-gradient-to-r hover:from-orange-500/60 hover:to-indigo-500/60 ${
                                    snapshot.isDragging
                                      ? "shadow-2xl shadow-orange-500/30 scale-105 z-50"
                                      : ""
                                  }`}
                                >
                                  <Card className="h-full w-full rounded-[15px] border-0 bg-slate-950/90 hover:bg-slate-900/95 backdrop-blur-xl p-4 space-y-3 transition-all duration-300 overflow-hidden relative">
                                    <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-orange-500/0 group-hover:bg-orange-500/15 blur-xl transition-all duration-500" />

                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2.5">
                                        <GripVertical className="h-4 w-4 text-slate-600 group-hover:text-orange-400 shrink-0 transition-colors" />
                                        <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors leading-snug">
                                          {task.title}
                                        </h4>
                                      </div>
                                      {getPriorityBadge(task.priority)}
                                    </div>

                                    {task.description && (
                                      <p className="text-xs text-slate-400 pl-6 line-clamp-2 leading-relaxed font-normal">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Footer Info: Sub-tasks, Due Date, Comments, & Assignee Avatar */}
                                    <div className="pl-6 pt-1 flex flex-wrap items-center gap-3 text-[11px]">
                                      {totalSub > 0 && (
                                        <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                                          <CheckSquare className="h-3.5 w-3.5 text-orange-400" />
                                          <span>
                                            {completedSub}/{totalSub} Selesai
                                          </span>
                                        </div>
                                      )}

                                      {task.dueDate &&
                                        (() => {
                                          const status = getDueDateStatus(
                                            task.dueDate,
                                          );
                                          if (!status) return null;
                                          return (
                                            <span
                                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${status.color}`}
                                            >
                                              {status.isOverdue ? (
                                                <AlertCircle className="h-3 w-3" />
                                              ) : (
                                                <CalendarIcon className="h-3 w-3" />
                                              )}
                                              {status.text}
                                            </span>
                                          );
                                        })()}

                                      {task.comments &&
                                        task.comments.length > 0 && (
                                          <div className="flex items-center gap-1 text-slate-400 font-semibold bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
                                            <MessageSquare className="h-3 w-3 text-indigo-400" />
                                            <span className="text-[10px]">
                                              {task.comments.length}
                                            </span>
                                          </div>
                                        )}

                                      {/* Badge Assignee / Foto Profil Penanggung Jawab */}
                                      {task.assignee && (
                                        <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-800 text-slate-300">
                                          {task.assignee.image ? (
                                            <img
                                              src={task.assignee.image}
                                              alt={
                                                task.assignee.name || "Assignee"
                                              }
                                              className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                                            />
                                          ) : (
                                            <div className="h-3.5 w-3.5 rounded-full bg-orange-500/80 text-[8px] font-bold text-white flex items-center justify-center shrink-0">
                                              {(
                                                task.assignee.name ||
                                                task.assignee.email ||
                                                "U"
                                              )
                                                .charAt(0)
                                                .toUpperCase()}
                                            </div>
                                          )}
                                          <span className="text-[10px] font-medium truncate max-w-[70px]">
                                            {task.assignee.name
                                              ? task.assignee.name.split(" ")[0]
                                              : task.assignee.email.split(
                                                  "@",
                                                )[0]}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setActiveColumnId(col.id);
                      setIsCreateTaskOpen(true);
                    }}
                    className="w-full text-xs font-semibold text-slate-400 hover:text-orange-400 hover:bg-slate-800/60 justify-start gap-2.5 rounded-2xl py-3 cursor-pointer transition-all border border-dashed border-slate-800/80 hover:border-orange-500/40"
                  >
                    <Plus className="h-4 w-4 text-slate-500 group-hover:text-orange-400" />
                    <span>Tambah Kartu Tugas</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </main>
      </DragDropContext>

      {/* Modal Tambah Kartu Tugas Baru */}
      {isCreateTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 overflow-y-auto py-10">
          <Card className="w-full max-w-lg border-slate-800 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-7 space-y-6 relative border my-auto">
            <button
              onClick={() => {
                setIsCreateTaskOpen(false);
                setActiveColumnId(null);
                setTaskTitle("");
                setTaskDesc("");
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-400" />
              <h2 className="text-xl font-extrabold tracking-tight">
                Buat Tugas Baru
              </h2>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Judul Tugas <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan judul tugas..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  autoFocus
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-11 px-4 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deskripsi
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan deskripsi tugas (opsional)..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-11 px-4 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Prioritas
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 rounded-2xl h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="LOW" className="bg-slate-900 text-slate-300">
                    LOW (Rendah)
                  </option>
                  <option
                    value="MEDIUM"
                    className="bg-slate-900 text-indigo-400"
                  >
                    MEDIUM (Normal)
                  </option>
                  <option value="HIGH" className="bg-slate-900 text-orange-400">
                    HIGH (Tinggi)
                  </option>
                  <option value="URGENT" className="bg-slate-900 text-red-400">
                    URGENT (Mendesak)
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsCreateTaskOpen(false);
                    setActiveColumnId(null);
                    setTaskTitle("");
                    setTaskDesc("");
                  }}
                  className="text-slate-400 hover:text-slate-200 rounded-2xl px-4 cursor-pointer font-semibold text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 font-bold shadow-lg shadow-orange-500/25 cursor-pointer transition-all text-xs h-10"
                >
                  {creating ? "Menyimpan..." : "Buat Tugas"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Tambah Kolom Baru */}
      {isAddingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 overflow-y-auto py-10">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-7 space-y-6 relative border my-auto">
            <button
              type="button"
              onClick={() => {
                setIsAddingColumn(false);
                setColumnTitle("");
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Kanban className="h-5 w-5 text-orange-400" />
              <h2 className="text-xl font-extrabold tracking-tight">
                Tambah Kolom Baru
              </h2>
            </div>

            <form onSubmit={handleCreateColumn} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Nama Kolom <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Review, Testing, Backlog..."
                  value={columnTitle}
                  onChange={(e) => setColumnTitle(e.target.value)}
                  required
                  autoFocus
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-11 px-4 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingColumn(false);
                    setColumnTitle("");
                  }}
                  className="text-slate-400 hover:text-slate-200 rounded-2xl px-4 cursor-pointer font-semibold text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={creatingCol}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 font-bold shadow-lg shadow-orange-500/25 cursor-pointer transition-all text-xs h-10"
                >
                  {creatingCol ? "Menyimpan..." : "Tambah Kolom"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Edit / Hapus Kolom */}
      {editingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 overflow-y-auto py-10">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-7 space-y-6 relative border my-auto">
            <button
              type="button"
              onClick={() => setEditingColumn(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-orange-400" />
              <h2 className="text-xl font-extrabold tracking-tight">
                Edit Kolom
              </h2>
            </div>

            <form onSubmit={handleUpdateColumn} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Nama Kolom <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={editColTitle}
                  onChange={(e) => setEditColTitle(e.target.value)}
                  required
                  autoFocus
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-11 px-4 text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteColumn}
                  disabled={deletingCol}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl gap-2 cursor-pointer font-semibold text-xs"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingCol ? "Menghapus..." : "Hapus Kolom"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingColumn(null)}
                    className="text-slate-400 hover:text-slate-200 rounded-2xl px-4 cursor-pointer font-semibold text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatingCol}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 font-bold shadow-lg shadow-orange-500/25 cursor-pointer transition-all text-xs h-10"
                  >
                    {updatingCol ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 1. Modal Detail & Edit Tugas */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 overflow-y-auto py-10">
          <Card className="w-full max-w-lg border-slate-800 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-7 space-y-6 relative border my-auto">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-orange-400" />
              <h2 className="text-xl font-extrabold tracking-tight">
                Detail & Edit Tugas
              </h2>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Judul Tugas
                </label>
                <Input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-11 px-4 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deskripsi
                </label>
                <Input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-11 px-4 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Prioritas
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 rounded-2xl h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="LOW" className="bg-slate-900 text-slate-300">
                    LOW (Rendah)
                  </option>
                  <option
                    value="MEDIUM"
                    className="bg-slate-900 text-indigo-400"
                  >
                    MEDIUM (Normal)
                  </option>
                  <option value="HIGH" className="bg-slate-900 text-orange-400">
                    HIGH (Tinggi)
                  </option>
                  <option value="URGENT" className="bg-slate-900 text-red-400">
                    URGENT (Mendesak)
                  </option>
                </select>
              </div>

              {/* Tenggat Waktu (Due Date) dengan Proteksi Role Owner */}
              <div className="space-y-2 mt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Tenggat Waktu (Due Date)</span>
                  {!isOwner && (
                    <span className="text-[10px] text-amber-400/90 font-medium lowercase">
                      Tidak memiliki akses
                    </span>
                  )}
                </label>
                <Input
                  type="date"
                  value={editDueDate}
                  disabled={!isOwner}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className={`w-full bg-slate-950/60 border border-slate-800 text-slate-100 rounded-2xl h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 [color-scheme:dark] ${
                    !isOwner
                      ? "opacity-50 cursor-not-allowed bg-slate-900"
                      : "cursor-pointer"
                  }`}
                />
              </div>

              {/* Penanggung Jawab (Assignee) dengan Proteksi Role Owner */}
              <div className="space-y-2 mt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Penanggung Jawab (Assignee)</span>
                  {!isOwner && (
                    <span className="text-[10px] text-amber-400/90 font-medium lowercase">
                      Tidak memiliki akses
                    </span>
                  )}
                </label>
                <select
                  value={editAssigneeId}
                  disabled={!isOwner}
                  onChange={(e) => setEditAssigneeId(e.target.value)}
                  className={`w-full bg-slate-950/60 border border-slate-800 text-slate-100 rounded-2xl h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    !isOwner
                      ? "opacity-50 cursor-not-allowed bg-slate-900"
                      : "cursor-pointer"
                  }`}
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- Tanpa Penanggung Jawab --
                  </option>
                  {workspaceMembers.map((member) => (
                    <option
                      key={member.user.id}
                      value={member.user.id}
                      className="bg-slate-900 text-slate-100"
                    >
                      {member.user.name || member.user.email} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  Komentar & Diskusi ({comments.length})
                </h3>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Tulis komentar atau catatan..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddComment(e as any);
                      }
                    }}
                    className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-10 px-3 text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddComment}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl px-4 h-10 text-xs shrink-0 cursor-pointer"
                  >
                    Kirim
                  </Button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {loadingComments ? (
                    <p className="text-xs text-slate-500 text-center py-2">
                      Memuat komentar...
                    </p>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">
                      Belum ada komentar pada tugas ini.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">
                            {comment.user?.name ||
                              comment.user?.email ||
                              "Pengguna"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(comment.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-orange-400" />{" "}
                    Checklist / Sub-tasks
                  </label>
                  {selectedTask.subTasks &&
                    selectedTask.subTasks.length > 0 && (
                      <span className="text-[11px] font-bold text-slate-400">
                        {Math.round(
                          (selectedTask.subTasks.filter((s) => s.isDone)
                            .length /
                            selectedTask.subTasks.length) *
                            100,
                        )}
                        % Selesai
                      </span>
                    )}
                </div>

                {selectedTask.subTasks && selectedTask.subTasks.length > 0 && (
                  <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-rose-500 h-full transition-all duration-300"
                      style={{
                        width: `${
                          (selectedTask.subTasks.filter((s) => s.isDone)
                            .length /
                            selectedTask.subTasks.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedTask.subTasks?.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-2xl px-3.5 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={sub.isDone}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSubTask(sub.id, sub.isDone);
                          }}
                          className="h-4 w-4 rounded accent-orange-500 cursor-pointer"
                        />
                        <span
                          className={`font-medium ${
                            sub.isDone
                              ? "line-through text-slate-500"
                              : "text-slate-200"
                          }`}
                        >
                          {sub.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubTask(sub.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Tambah poin pekerjaan..."
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubTask(e);
                      }
                    }}
                    className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-10 px-3 text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSubTask}
                    disabled={addingSubTask}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl px-4 h-10 text-xs shrink-0 cursor-pointer"
                  >
                    {addingSubTask ? "Menambah..." : "Tambah"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteTask}
                  disabled={deleting}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl gap-2 cursor-pointer font-semibold"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Menghapus..." : "Hapus Tugas"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedTask(null)}
                    className="text-slate-400 hover:text-slate-200 rounded-2xl px-4 cursor-pointer font-semibold"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 font-bold shadow-lg shadow-orange-500/25 cursor-pointer transition-all"
                  >
                    {updating ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      <InviteMemberModal
        workspace={workspace}
        setWorkspace={setWorkspace}
        isInviteOpen={isInviteOpen}
        setIsInviteOpen={setIsInviteOpen}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        handleInviteMember={handleInviteMember}
        inviting={inviting}
        showToast={showToast}
      />
    </div>
  );
}

export default function KanbanBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          <Loader2 className="h-9 w-9 animate-spin text-orange-500" />
        </div>
      }
    >
      <KanbanBoardContent />
    </Suspense>
  );
}
