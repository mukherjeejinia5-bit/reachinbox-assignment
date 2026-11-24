# ReachInbox - Email Scheduler

A full-stack email scheduling application built using React, Node.js, Express, BullMQ, Redis, and PostgreSQL.

## Features

- Schedule emails for a specific date and time.
- Add multiple email addresses.
- Set a delay between emails.
- Configure hourly email sending limits.
- Background email processing using BullMQ and Redis.
- Automatic rescheduling when the hourly limit is reached.
- Store scheduled and sent email records in PostgreSQL.
- View Scheduled Emails and Sent Emails.
- Google OAuth login.
- Bull Board dashboard for monitoring email queues.
- Ethereal SMTP for testing email delivery.

## Tech Stack

**Frontend**
- React
- TypeScript
- Tailwind CSS
- Vite

**Backend**
- Node.js
- Express.js
- TypeScript

**Database and Queue**
- PostgreSQL
- Redis
- BullMQ

**Email**
- Nodemailer
- Ethereal SMTP

## Project Structure

```text
reachinbox-assignment/
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env
│
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Configure the backend `.env` file with:

```env
PORT=5000
REDIS_URL=your_redis_url
DATABASE_URL=your_postgresql_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Do not upload actual credentials or secret values to GitHub.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/schedule | Schedule emails |
| GET | /api/emails?status=scheduled | View scheduled emails |
| GET | /api/emails?status=sent | View sent emails |
| GET | /auth/google | Google login |

## Queue Monitoring

Bull Board Dashboard:

```text
http://localhost:5000/admin/queues
```

## Email Testing

The application uses Ethereal Email for testing. It generates preview links to inspect test emails.

## Author

ReachInbox Email Scheduler Project