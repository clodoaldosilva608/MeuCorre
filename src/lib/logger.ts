// ===== Logs estruturados =====
//
// Formato JSON para fácil parse em Vercel logs / Datadog / Splunk.
// Inclui correlation ID para rastrear request end-to-end.
//
// Uso:
//   import { logger } from "@/lib/logger";
//   logger.info("sync completed", { userId, deliveries: 500, ms: 1234 });
//   logger.error("webhook failed", { orderId, error: err.message });
//
// Em produção (NODE_ENV=production), logs vão para stdout em JSON.
// Em desenvolvimento, logs são coloridos e legíveis.

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m",  // green
  warn: "\x1b[33m",  // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

function shouldLog(level: LogLevel): boolean {
  const minLevel = (process.env.LOG_LEVEL ?? "info") as LogLevel;
  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  return levels.indexOf(level) >= levels.indexOf(minLevel);
}

function formatLog(level: LogLevel, message: string, context: LogContext = {}): string {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase();

  if (process.env.NODE_ENV === "production") {
    // Produção: JSON estruturado para Vercel/Datadog
    return JSON.stringify({
      timestamp,
      level: levelUpper,
      message,
      ...context,
    });
  }

  // Desenvolvimento: colorido e legível
  const contextStr = Object.keys(context).length > 0
    ? " " + JSON.stringify(context)
    : "";
  return `${LEVEL_COLORS[level]}[${levelUpper}]${RESET} ${timestamp} ${message}${contextStr}`;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog("debug")) {
      console.log(formatLog("debug", message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog("info")) {
      console.log(formatLog("info", message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog("warn")) {
      console.warn(formatLog("warn", message, context));
    }
  },

  error(message: string, context?: LogContext): void {
    if (shouldLog("error")) {
      console.error(formatLog("error", message, context));
    }
  },
};

/**
 * Gera correlation ID para rastrear request end-to-end.
 * Use no início de cada API route handler.
 */
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
