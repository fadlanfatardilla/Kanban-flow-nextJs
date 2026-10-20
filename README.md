# ⚡ Kanban Flow — Modern Workspace & Task Management SaaS

A modern, high-performance **Kanban Workspace & Task Management SaaS Platform** built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **NextAuth.js**. Designed with an ultra-modern dark-mode glassmorphism interface, real-time board interactivity, custom workspace security PINs, sub-task progress tracking, and full workspace management.

![Next JS](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

---

## ✨ Key Features

- **Multi-Tenant Workspaces** — Create, manage, and switch between multiple personal or team workspaces (e.g., *QuantumPulse Labs*, *Apex Security & Cloud Operations*, *Weekend & Lifestyle Hub*).
- **Interactive Kanban Boards** — Organize tasks across customizable columns (*To Do*, *In Progress*, *Review & Testing*, *Done*).
- **Task Micro-Management** — Detailed task modal with sub-task progress tracking (checklists), comment discussions, priority badges (*Urgent*, *High*, *Medium*, *Low*), and activity logs.
- **Secure Workspace Invite & PIN System** — Join workspaces via unique invite links protected by a 4-digit security PIN.
- **Glassmorphism Dark UI** — Futuristic dark-mode interface featuring dynamic ambient light glows, smooth transitions, and responsive layouts.
- **Custom Modern Confirmation Modals** — Replaced native browser alerts with custom interactive modal dialogs for critical actions like workspace deletion.
- **Cascade Deletion API** — Delete workspaces safely with Prisma relational cascade deletion (automatically cleans up child boards, tasks, comments, and member roles).

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router with Server Actions & Turbopack)
- **Language:** TypeScript
- **Database & ORM:** PostgreSQL / SQLite with Prisma ORM
- **Authentication:** NextAuth.js
- **Styling & UI:** Tailwind CSS, Lucide Icons, Shadcn UI
- **Deployment:** Vercel

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) 18.x or higher
- [npm](https://www.npmjs.com/) / [pnpm](https://pnpm.io/) / [yarn](https://yarnpkg.com/)
- PostgreSQL database instance (or SQLite for local development)

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/kanban-flow.git](https://github.com/your-username/kanban-flow.git)
   cd kanban-flow