# Trainee Management System (TMS)

A comprehensive, state-of-the-art web application for managing cohorts, batches, progression stages, trainee assignments, and attendance tracking, featuring a dedicated dashboard for Regional Managers and integrated logistic request handling.

---

## 🚀 Key Features

### 1. Batch & Training Stage scheduling
- **Progression Stepper**: Manage training stages: **Basic**, **Refresher 1**, and **Refresher 2**.
- **Interactive Calendar**: Visualize scheduled training events and stages with color-coded, gradient-based cards.
- **Stage Progression Rules**: Pre-schedule stages dynamically and update schedules seamlessly.

### 2. Stage-Based Attendance Tracking
- Track daily attendance (Present, Absent, Late) linked directly to the active training stage.
- Auto-constrained date selection based on scheduled stage boundaries with warning locks for unscheduled stages.

### 3. Trainee & Regional Office Assignment
- Assign trainees to specific regional offices under their batch's division.
- Interactive dropdown interfaces for Batch Managers/Admins with immediate persistence.

### 4. Dedicated Regional Manager (RM) Dashboard
- **Role Isolation**: Strict sidebar controls and route guards locking RM access strictly to their dashboard.
- **Interactive Cohorts Breakdown**: Interactive visual cards aggregating trainee counts per cohort. Click a card to filter the trainees table.
- **Unified Table**: Review Trainee ID, Name, Email, Phone, Regional Office, Cohort, and Stage attendance statistics in one view.
- **Multi-Filter**: Search by text or select a cohort from a dropdown selector.

### 5. Logistics Management & Google Integration
- Submit and manage logistic requests (materials, venues) for training stages.
- Integrated Google Calendar syncing and OAuth integrations.

---

## 🛠️ Technology Stack

### Backend
- **Core**: Python 3.11, Django 4.2
- **API Framework**: Django REST Framework (DRF)
- **Authentication**: SimpleJWT (JSON Web Tokens)
- **Database**: SQLite3 (default for local development)

### Frontend
- **Framework**: React.js (built with Vite)
- **UI & Components**: Material UI (MUI v5)
- **Icons**: MUI Icons Material
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios

---

## ⚙️ Getting Started

### Prerequisites
- Python 3.11+
- Node.js (v18+) & npm

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Seed database data:
   ```bash
   python manage.py seed_tms
   python manage.py seed_divisions_and_offices
   python manage.py seed_mixed_batches
   ```
6. Start the Django dev server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Running Tests
To run the automated Python backend test suite:
```bash
cd backend
.\venv\Scripts\python manage.py test
```

To verify the production compilation of the frontend bundle:
```bash
cd frontend
npm run build
```
