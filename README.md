# 🏛️ Sovereign Lens: DBT Leakage Intelligence System

An advanced full-stack intelligence platform built for the Government of Gujarat to detect, flag, and audit leakage in Direct Benefit Transfer (DBT) schemes.

## 🌟 The Problem
Gujarat disburses massive welfare benefits through DBT across multiple schemes. Current systems lack real-time anomaly detection, leading to several critical failure modes: funds reaching deceased beneficiaries, undocumented duplicate identities, unclaimed dormant funds, and cross-scheme duplication.

## 🚀 Our Solution: Sovereign Lens
Sovereign Lens is a high-performance transaction monitoring engine and governance hub. It ingests large-scale DBT records and flags specialized leakage patterns before the next payment cycle hits.

### Core Leakage Detectors
1. **Deceased Beneficiary Detection**: Cross-references Aadhaar and fuzzy-matched normalized names against the civil death register to halt post-mortem payments.
2. **Duplicate Identity Detection**: Identifies highly identical profiles (handling localized Gujarati transliteration nuances) claiming under the same scheme.
3. **Unwithdrawn Funds Detection**: Flags cases where funds are successfully credited but remain dormant for over 90 days, indicating systemic interception or beneficiary notification failure.
4. **Cross-Scheme Duplication**: Identifies identical Aadhaar profiles improperly claiming mutually exclusive schemes.

## 🛠️ Key Features
- **High-Speed Processing:** Ingests and evaluates 50,000+ transaction records in under 4 seconds via SQLite WAL mode and an optimized custom Node.js Engine.
- **Multi-Role Dashboards (RBAC):** Distinct specialized dashboards for DFO Admins, Field Verifiers, Compliance Auditors, and State Admins.
- **Google OAuth Integration:** Securely sign in using your existing Google Workspace or Gmail accounts. New users are dynamically routed to an interactive Role Selection process without needing manual provisioning.
- **Hot-Swappable Data Environments:** A dynamic "Change Database" feature inside the Admin Dashboard allows state administrators to inject entirely new datasets (CSV pairs) on the fly via `multer` file uploads and reprocess leakage scenarios dynamically.
- **AI Investigation Briefs:** Native Google Gemini AI integration synthesizes complex evidence data into 1-paragraph actionable briefs for field investigators.
- **Structured Audit Evidence:** Explainable-AI approach showing precisely *why* a transaction was flagged (e.g., 100% name match + 1201 days since death).
- **Automated District Analytics:** Real-time risk distribution across Gujarat districts through integrated heatmaps.

## 💻 Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Recharts, Framer Motion
- **Backend:** Node.js, Express.js, Multer
- **Database:** SQLite (better-sqlite3) optimized with WAL mode and memory pragmas
- **Authentication:** @react-oauth/google, JWT Sessions
- **AI Integration:** Google Gemini API 

## ⚙️ How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key
- Google OAuth Client ID & Secret

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/13Mahir/RadeonActive.git
   cd RadeonActive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=dbt-intelligence-secret-2024-gujarat
   DB_PATH=./server/data/dbt.db
   CSV_TRANSACTIONS=./data/TS-PS4-1.csv
   CSV_DEATHS=./data/TS-PS4-2.csv
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_CLIENT_ID=your_oauth_client_id_here
   GOOGLE_CLIENT_SECRET=your_oauth_secret_here
   ```

4. **Initialize & Seed the Database**
   This script drops the local database, recreates the schema, runs the ingestion risk engine over the initial data, and generates the standard test users!
   ```bash
   npm run seed
   ```

5. **Launch Application**
   ```bash
   npm run dev
   ```
   This will concurrently start the backend API on port `3001` and the React frontend on port `3000`.

### Default Demo Logins
If not using the Google OAuth Sign In, you can use the built-in fast-login fallback:
- **DFO:** `dfo_admin` / `dfo123`
- **Field Verifier:** `verifier_01` / `verify123`
- **State Auditor:** `auditor_01` / `audit123`
- **State Admin:** `state_admin` / `admin123`

## 🤝 Project Architecture
- `/src` - React frontend (Pages, Role-Based Access Dashboards, Multi-Language UI Components)
- `/server` - Node.js Express backend (Routes, DB Schema, Authentication, File Injection)
- `/server/engine` - Core transaction processing, rule engines, and Gujarati normalizer
- `/data` - Simulated baseline datasets representing massive-scale financial logs
