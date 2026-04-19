# 🏗️ MadCollab Architecture

This document provides a technical overview of the MadCollab platform, covering its system architecture, technology stack, and database schema.

---

## 🛰️ System Overview

MadCollab is a full-stack web application designed for the UW-Madison community. It facilitates project partner matching through a high-performance, data-driven platform.

### Monorepo Structure
```text
/MadCollab/projecthub-fullstack
├── backend/            # Express.js (TypeScript) Server & Prisma ORM
│   ├── prisma/         # Database schema and migrations
│   ├── src/            # Backend logic (Routes, Controllers, Services)
│   └── scripts/        # Utility scripts (indexing, migration support)
├── projecthub/         # Next.js (TypeScript) Frontend
│   ├── app/            # App Router (Pages and API Routes)
│   ├── components/     # UI Components (React + Tailwind)
│   └── lib/            # Shared utilities and Firebase config
└── docker-compose.yml  # Local development environment (PostgreSQL)
```

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14/15/16** | SSR/ISR, Routing, and modern UI management. |
| | **TypeScript** | Static typing for reliable development. |
| | **Tailwind CSS** | Utility-first styling with modern aesthetics. |
| **Backend** | **Node.js + Express** | High-performance API handling. |
| | **Prisma ORM** | Type-safe database access and schema management. |
| **Database** | **PostgreSQL** | Reliable relational data storage. |
| **Services** | **Firebase** | Cloud storage for profile images and potentially Auth. |

---

## 📊 Database Schema (Prisma)

The database is optimized for complex relationships between students, projects, and applications.

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ Application : submits
    User ||--o{ Experience : has
    User ||--o{ Education : has
    User ||--o{ Notification : receives
    User ||--o{ PeerReview : gives/receives
    User ||--o{ Bookmark : saves
    
    Project ||--o{ Application : receives
    Project ||--o{ ProjectRole : defines
    Project ||--o{ ChecklistItem : has
    Project ||--o{ ProjectLog : tracks
    Project ||--o{ TechStack : requires
    
    Application }|--|| ProjectRole : targets
```

### Core Models Detail

#### 1. User
Stores student profiles, campus-specific data, and reputation metrics.
- **UW-Specific**: `major`, `year`.
- **Profile**: `bio`, `techStacks`, `workStyles`, `futureRole`.
- **Reputation**: `badges` (earned via peer reviews), `completedProjectCount`.

#### 2. Project
The central entity for matching.
- **UW-Specific**: `courseCode` (e.g., CS506), `semester`.
- **Status**: `DRAFT`, `OPEN`, `FILLED`, `CLOSED`, `COMPLETED`.
- **Matching Info**: `meetingType` (Online/Offline), `screeningQuestions`.

#### 3. Application
Manages the lifecycle of a student joining a project.
- **Fields**: `status` (Pending/Accepted/Rejected), `resumeUrl`, `answers` (to screening questions).

#### 4. PeerReview
The core of the reputation system.
- **Workflow**: Triggered after project completion.
- **Output**: Mentors/Teammates award `BadgeType` (CODE_WIZARD, DEADLINE_FAIRY, etc.).

---

## ⚙️ Core Logic Flow

### A. Partner Matching Flow
1. **Discovery**: User filters by `courseCode` or `category`.
2. **Application**: User submits an application with role selection and screening answers.
3. **Review**: Project owner receives a notification, reviews the profile/answers, and accepts/rejects.
4. **Member Join**: Upon acceptance, the application status changes, and a `ProjectLog` is created.

### B. Project Completion & Reputation
1. **Closing**: Owner requests project completion.
2. **Review Phase**: Team members are prompted to review each other.
3. **Badge Awarding**: Peer reviews are aggregated; users receive badges on their profile based on consensus.

---

## ⚡ Performance & Optimization
As noted in the project highlights, the database uses advanced indexing (defined in `schema.prisma`) to ensure sub-millisecond query results for project exploration and user filtering.

> [!NOTE]
> All core tables use UUIDs for IDs to ensure security and scalability across distributed systems.
