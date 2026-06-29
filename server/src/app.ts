import Fastify, { type FastifyInstance } from "fastify";
import { env } from "./config/env";
import { healthRoutes } from "./api/health";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
  });
  app.register(healthRoutes);
  return app;
}
