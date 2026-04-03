/**
 * Echo SDK Gateway — Canonical response envelope (CONTRACT §3).
 *
 * Every response from this Worker uses the same envelope shape:
 *   { success, data, error, meta }
 */

import type { Envelope } from '../types';

const SERVICE_NAME = 'echo-sdk-gateway';

export function success<T>(data: T, version: string, latency_ms?: number): Envelope<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      ts: new Date().toISOString(),
      version,
      service: SERVICE_NAME,
      ...(latency_ms !== undefined && { latency_ms: Math.round(latency_ms * 100) / 100 }),
    },
  };
}

export function error(message: string, code: string, version: string, latency_ms?: number): Envelope<null> {
  return {
    success: false,
    data: null,
    error: { message, code },
    meta: {
      ts: new Date().toISOString(),
      version,
      service: SERVICE_NAME,
      ...(latency_ms !== undefined && { latency_ms: Math.round(latency_ms * 100) / 100 }),
    },
  };
}
