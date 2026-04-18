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
- **AI Investigation Briefs:** Integrated Gemini AI integration to synthesize complex evidence data into 1-paragraph actionable briefs for field investigation.
- **Structured Audit Evidence:** Explainable-AI approach showing precisely *why* a transaction was flagged (e.g. 100% name match + 1201 days since death).
- **Automated District Analytics:** Real-time risk distribution across Gujarat districts.

## 💻 Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Recharts, Framer Motion
- **Backend:** Node.js, Express.js
- **Database:** SQLite (better-sqlite3) optimized with WAL mode and memory pragmas
- **AI Integration:** Google Gemini API 

## ⚙️ How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key

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
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key_here
   TRANSACTIONS_CSV=./data/TS-PS4-1.csv
   DEATH_REGISTER_CSV=./data/TS-PS4-2.csv
   DB_PATH=./server/data/dbt.db
   ```
   *(Ensure CSV files match the paths allocated in your data directory).*

4. **Launch Application**
   ```bash
   npm run dev
   ```
   This will simultaneously start the Express backend on port `3001` and the React frontend on port `3000`.

## 🤝 Project Architecture
- `/src` - React frontend (Pages, Contexts, UI Components)
- `/server` - Node.js Express backend (Routes, DB Schema)
- `/server/engine` - Core anomaly and leakage pattern detection algorithms
- `/data` - Simulated dataset CSVs representing scheme records
