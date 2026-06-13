# Real Estate Booking Platform Prototype

This is a full-stack Real Estate Booking Platform built as a prototype for a university DBMS mini-project.

## Tech Stack
* **Frontend:** React (Vite), Bootstrap 5, React Router, Axios
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL

## Setup Instructions

### 1. Database Setup
1. Ensure PostgreSQL is installed and running on your machine.
2. Create a database named `real_estate_db` (or whatever you configure in `.env`).
3. Run the SQL schema script to create tables, functions, triggers, and seed data:
   ```bash
   cd backend
   psql -U postgres -d real_estate_db -f schema.sql
   ```
   *(Note: Adjust `-U postgres` based on your PostgreSQL username)*

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env.example` file to `.env` and adjust the database credentials if necessary:
   ```bash
   cp .env.example .env
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:5000`.

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000` (or another port specified by Vite).

## Demo Accounts
The database is pre-seeded with the following accounts (Password for all is `password123`):
* **Admin:** admin@test.com
* **Agent:** agent@test.com
* **Customer:** customer@test.com

## Features Demonstrated
* **DB-UI Connectivity:** Live updates and real-time database querying.
* **Transactions & Functions:** Booking and payment are wrapped in a single PostgreSQL transaction (`confirm_booking`).
* **Triggers:** Automatic property status updates upon booking confirmation.
* **Complex Queries:** Admin dashboard displays aggregate data (revenue, top agents, most booked city).
* **Role-based Access:** Different views and permissions for Customer, Agent, and Admin.
