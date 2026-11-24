import "dotenv/config";
import { Redis as IORedis } from "ioredis";
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing");
}

export const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});