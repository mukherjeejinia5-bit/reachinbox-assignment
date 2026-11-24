import "./worker.js";
import { pool } from "./db.js";
import { initDb } from "./db.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { emailQueue } from "./emailQueue.js";
import { OAuth2Client } from "google-auth-library";
// Bull Board imports
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
console.log("Google Client ID loaded:", Boolean(process.env.GOOGLE_CLIENT_ID));
const googleOAuthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/auth/google/callback"
);

// Google Login
app.get("/auth/google", (req, res) => {
  const authUrl = googleOAuthClient.generateAuthUrl({
     redirect_uri: "http://localhost:5000/auth/google/callback",
    access_type: "offline",
    scope: ["openid", "email", "profile"],
  });
console.log("Google Auth URL:", authUrl);
  res.redirect(authUrl);
});

// Google Login Callback
app.get("/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;

    const { tokens } = await googleOAuthClient.getToken(code);

    if (!tokens.id_token) {
      return res.status(400).send("Google login failed");
    }

    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const user = ticket.getPayload();

   res.redirect("http://localhost:5173");
  } catch (error) {
    console.error("Google OAuth Error:", error);
    res.status(500).send("Google Login Failed");
  }
});

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

dotenv.config({ override: true });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ReachInbox Backend is Running!");
});

app.post("/api/schedule", async (req, res) => {
  const {
    emails,
    subject,
    body,
    startTime,
    delay,
    hourlyLimit,
  } = req.body;

  if (!emails || !subject || !body || !startTime) {
    return res.status(400).json({
      message: "Please fill all required fields",
    });
  }

  try {
    const emailList = Array.isArray(emails)
      ? emails
      : emails.split(/[,\n;]/).map((email: string) => email.trim());

    const startTimestamp = new Date(startTime).getTime();

    if (isNaN(startTimestamp)) {
      return res.status(400).json({
        message: "Invalid start time",
      });
    }

    const delayInMs = Math.max(0, Number(delay || 0) * 1000);

    let totalScheduled = 0;

    for (let i = 0; i < emailList.length; i++) {
      const email = emailList[i].trim();

      if (!email) continue;

      const scheduledDelay =
        Math.max(0, startTimestamp - Date.now()) + i * delayInMs;

      const scheduledAt = new Date(Date.now() + scheduledDelay);

      const result = await pool.query(
        `INSERT INTO scheduled_emails
        (email, subject, body, status, scheduled_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [email, subject, body, "scheduled", scheduledAt]
      );

      const databaseId = result.rows[0].id;

      await emailQueue.add(
        "send-email",
        {
          email,
          subject,
          body,
          hourlyLimit,
          databaseId,
        },
        {
          delay: scheduledDelay,
          jobId: `email-${databaseId}`,
        }
      );

      totalScheduled++;
    }

    return res.status(201).json({
      message: "Emails scheduled successfully!",
      totalEmails: totalScheduled,
      delay,
      hourlyLimit,
    });

  } catch (error) {
    console.error("Queue Error:", error);

    return res.status(500).json({
      message: "Failed to schedule emails",
    });
  }
});
app.get("/api/emails", async (req, res) => {
  try {
    const status = req.query.status;

    if (status !== "scheduled" && status !== "sent") {
      return res.status(400).json({
        message: "Invalid email status",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        email,
        subject,
        status,
        scheduled_at AS "scheduledAt",
        sent_at AS "sentAt"
       FROM scheduled_emails
       WHERE status = $1
       ORDER BY id DESC`,
      [status]
    );

    return res.json({
      emails: result.rows,
    });

  } catch (error) {
    console.error("Email Fetch Error:", error);

    return res.status(500).json({
      message: "Failed to fetch emails",
    });
  }
});
const PORT = process.env.PORT || 5000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });