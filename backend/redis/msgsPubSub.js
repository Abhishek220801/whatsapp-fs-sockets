import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PWD,
  username: process.env.REDIS_USER,
  tls: {}, // ensures secure connection on cloud Redis (like Render, Upstash, etc.)
};

// Shared publisher instance for all publishes
const publisher = new Redis(redisConfig);

// Each socket connection gets its own Redis subscriber instance
export function createSubscriber() {
  const subscriber = new Redis(redisConfig);
  return subscriber;
}

// Function to publish messages to Redis
export async function publish(channel, message) {
  try {
    await publisher.publish(channel, message);
    console.log(`✅ Published message to ${channel}: ${message}`);
  } catch (error) {
    console.error("❌ Error publishing message:", error);
  }
}
