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

---

## 🌐 Production Deployment (Ubuntu VM + PostgreSQL)

This guide walks you through deploying the Trainee Management System (TMS) on a fresh **Ubuntu 22.04 / 24.04 VM** using **PostgreSQL** as the database, **Gunicorn** as the WSGI server, and **Nginx** as the reverse proxy.

### 📋 Prerequisites
Before you begin, ensure you have:
- An Ubuntu VM with a public IP.
- SSH access to the VM with `sudo` privileges.
- A domain name pointing to the VM's public IP (optional, but recommended).

---

### Step 1: System Updates & Dependencies
Connect to your VM via SSH and update the system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

Install the required system tools, PostgreSQL, Nginx, Node.js (for the frontend build), and Python utilities:
```bash
# Install Python, pip, virtualenv, Git, Nginx, and PostgreSQL
sudo apt install python3-pip python3-venv git nginx postgresql postgresql-contrib libpq-dev -y

# Install Node.js (v18+) and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

---

### Step 2: Configure PostgreSQL Database
1. Switch to the default `postgres` user:
   ```bash
   sudo -i -u postgres
   ```
2. Open the PostgreSQL prompt:
   ```bash
   psql
   ```
3. Create the database, database user, and configure settings for Django:
   ```sql
   CREATE DATABASE tms;
   CREATE USER tms_user WITH PASSWORD 'your_secure_password';
   ALTER ROLE tms_user SET client_encoding TO 'utf8';
   ALTER ROLE tms_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE tms_user SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE tms TO tms_user;
   \q
   ```
4. Exit the postgres user session:
   ```bash
   exit
   ```

---

### Step 3: Clone the Application & Set Permissions
We will host the project in `/var/www/tms`:
```bash
sudo mkdir -p /var/www/tms
sudo chown -R $USER:www-data /var/www/tms
git clone <your-repository-url> /var/www/tms
cd /var/www/tms
```

---

### Step 4: Configure Django Backend
1. **Initialize Virtual Environment**:
   ```bash
   cd /var/www/tms/backend
   python3 -m venv venv
   source venv/bin/activate
   ```
2. **Install Dependencies**:
   Install backend packages and the PostgreSQL database adapter:
   ```bash
   pip install -r requirements.txt
   pip install psycopg2-binary gunicorn
   ```
3. **Update Settings (`backend/tms_backend/settings.py`)**:
   Open settings.py in a text editor (e.g., `nano tms_backend/settings.py`) and make the following adjustments:
   
   - **Allowed Hosts**: Add your VM's public IP or domain name.
     ```python
     ALLOWED_HOSTS = ['your_domain.com', 'your_vm_public_ip']
     ```
   - **Debug Mode**: Turn off debug mode for safety.
     ```python
     DEBUG = False
     ```
   - **PostgreSQL Settings**: Update `DATABASES` to use the Postgres database created earlier.
     ```python
     DATABASES = {
         'default': {
             'ENGINE': 'django.db.backends.postgresql',
             'NAME': 'tms',
             'USER': 'tms_user',
             'PASSWORD': 'your_secure_password',
             'HOST': 'localhost',
             'PORT': '5432',
         }
     }
     ```
   - **Static Files Root**: Define `STATIC_ROOT` so Django can collect production static files in a single folder. Add this line near `STATIC_URL`:
     ```python
     STATIC_ROOT = BASE_DIR / 'staticfiles'
     ```
4. **Migrate & Seed the Database**:
   ```bash
   python manage.py migrate
   python manage.py seed_tms
   python manage.py seed_divisions_and_offices
   python manage.py seed_mixed_batches
   ```
5. **Collect Backend Static Files**:
   ```bash
   python manage.py collectstatic --noinput
   ```
6. **Deactivate Virtual Environment**:
   ```bash
   deactivate
   ```

---

### Step 5: Configure Gunicorn with Systemd
Gunicorn will act as the application server, running Django backend as a background service.

1. **Create Gunicorn Socket**:
   ```bash
   sudo nano /etc/systemd/system/gunicorn.socket
   ```
   Paste the following:
   ```ini
   [Unit]
   Description=gunicorn socket

   [Socket]
   ListenStream=/run/gunicorn.sock

   [Install]
   WantedBy=sockets.target
   ```

2. **Create Gunicorn Service**:
   ```bash
   sudo nano /etc/systemd/system/gunicorn.service
   ```
   Paste the following (replace `ubuntu` with your VM username if different in the `User=` directive):
   ```ini
   [Unit]
   Description=gunicorn daemon
   Requires=gunicorn.socket
   After=network.target

   [Service]
   User=ubuntu
   Group=www-data
   WorkingDirectory=/var/www/tms/backend
   ExecStart=/var/www/tms/backend/venv/bin/gunicorn \
             --access-logfile - \
             --workers 3 \
             --bind unix:/run/gunicorn.sock \
             tms_backend.wsgi:application

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start & Enable Services**:
   ```bash
   sudo systemctl start gunicorn.socket
   sudo systemctl enable gunicorn.socket
   ```

---

### Step 6: Build the Frontend
1. **Configure API Endpoint**:
   Open `frontend/src/context/AuthContext.jsx` and modify `API_URL` to point to the relative `/api/` path or the VM's public IP:
   ```javascript
   export const API_URL = '/api/';
   ```
2. **Install & Build**:
   ```bash
   cd /var/www/tms/frontend
   npm install
   npm run build
   ```
   This compiles the React assets into the static directory `/var/www/tms/frontend/dist`.

---

### Step 7: Configure Nginx as Reverse Proxy
1. Create a new Nginx server configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/tms
   ```
   Paste the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com your_vm_public_ip;

       # Frontend Production Build
       location / {
           root /var/www/tms/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API & Django Admin
       location ~ ^/(api|admin) {
           include proxy_params;
           proxy_pass http://unix:/run/gunicorn.sock;
       }

       # Backend Collected Static Files
       location /static/ {
           alias /var/www/tms/backend/staticfiles/;
       }
   }
   ```
2. Enable the site configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/tms /etc/nginx/sites-enabled/
   ```
3. Test Nginx syntax and restart:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

### Step 8: Configure Firewall & Permissions
1. Adjust directory permissions to allow Nginx to read the build assets:
   ```bash
   sudo chmod -R 755 /var/www/tms
   ```
2. Allow traffic through UFW firewall:
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

Your Trainee Management System is now live! Access the application via your server's IP address or domain name.
