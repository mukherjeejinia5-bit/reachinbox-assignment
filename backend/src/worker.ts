import { pool } from "./db.js";
import type { Transporter } from "nodemailer";
import { Worker } from "bullmq";
import { connection } from "./redis.js";
import { emailQueue } from "./emailQueue.js";
import nodemailer from "nodemailer";

let testAccount:
  | Awaited<ReturnType<typeof nodemailer.createTestAccount>>
  | undefined;

let transporter: Transporter | undefined;

async function getTestTransporter() {
  if (!testAccount || !transporter) {
    testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return { testAccount, transporter };
}

const rateLimitScript = `
  local now = tonumber(ARGV[1])
  local limit = tonumber(ARGV[2])
  local member = ARGV[3]

  redis.call("ZREMRANGEBYSCORE", KEYS[1], 0, now - 3600000)

  local count = redis.call("ZCARD", KEYS[1])

  if count >= limit then
    local oldest = redis.call("ZRANGE", KEYS[1], 0, 0, "WITHSCORES")
    return {0, tonumber(oldest[2]) + 3600000 - now}
  end

  redis.call("ZADD", KEYS[1], now, member)
  redis.call("EXPIRE", KEYS[1], 3700)

  return {1, 0}
`;

export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { email, subject, body, hourlyLimit, databaseId } = job.data;

    const limit = Math.max(1, Number(hourlyLimit) || 50);
    const now = Date.now();

    const result = await connection.eval(
      rateLimitScript,
      1,
      "reachinbox:hourly-limit",
      now,
      limit,
      String(job.id)
    ) as number[];

    if (Number(result[0]) === 0) {
      const waitTime = Math.max(1000, Number(result[1]));

      console.log("Hourly limit reached. Rescheduling:", email);

      await emailQueue.add(
        "send-email",
        { email, subject, body, hourlyLimit, databaseId },
        {
          delay: waitTime,
          jobId: `rescheduled-${job.id}-${now}`,
        }
      );

      return;
    }

    const { testAccount, transporter } =
      await getTestTransporter();

    const info = await transporter.sendMail({
      from: testAccount.user,
      to: email,
      subject,
      text: body,
    });
await pool.query(
  `UPDATE scheduled_emails
   SET status = $1, sent_at = CURRENT_TIMESTAMP
   WHERE id = $2`,
  ["sent", databaseId]
);
    console.log("Email sent:", email);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  },
  {
    connection,
    concurrency: 5,
  }
);

console.log("Email Worker is running!");