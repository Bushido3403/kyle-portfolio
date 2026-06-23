// Source: src/app/api/v1/telemetry/route.ts — IoT gateway ingestion endpoint
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  authenticateGatewayByApiKey,
  extractGatewayApiKey,
} from "@/lib/telemetry/auth";
import { ingestGatewayReadings } from "@/lib/telemetry/ingest";
import {
  normalizeReadings,
  summarizeSequences,
  validateNormalizedReadings,
} from "@/lib/telemetry/normalize";
import { gatewayUploadSchema } from "@/lib/telemetry/schema";

function extractDeviceTypesFromPayload(payload: unknown): string[] {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("readings" in payload) ||
    !Array.isArray((payload as { readings: unknown }).readings)
  ) {
    return [];
  }
  const types = new Set<string>();
  for (const reading of (payload as { readings: Record<string, unknown>[] })
    .readings) {
    if (typeof reading?.device_type === "string") {
      types.add(reading.device_type);
    } else if ("temperature" in reading) {
      types.add("nodifyr.climate.v1");
    }
  }
  return [...types];
}

function extractSequenceRange(payload: unknown): {
  first: number | null;
  last: number | null;
} {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("readings" in payload) ||
    !Array.isArray((payload as { readings: unknown }).readings)
  ) {
    return { first: null, last: null };
  }
  const sequences = (
    payload as { readings: { sequence?: number }[] }
  ).readings
    .map((r) => r.sequence)
    .filter((s): s is number => typeof s === "number");
  if (sequences.length === 0) return { first: null, last: null };
  return {
    first: Math.min(...sequences),
    last: Math.max(...sequences),
  };
}

// Secure ingestion point for IoT gateways (uploader.c). Hardware authenticates
// with a bearer API key; the key resolves to a gateway row whose organization_id
// scopes all writes. Payloads are validated with Zod then the device type registry.
export async function POST(request: NextRequest) {
  const apiKey = extractGatewayApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const gateway = await authenticateGatewayByApiKey(apiKey);
  if (!gateway) {
    return NextResponse.json({ error: "Unauthorized gateway" }, { status: 401 });
  }

  const readingsLength =
    typeof payload === "object" &&
    payload !== null &&
    "readings" in payload &&
    Array.isArray((payload as { readings: unknown }).readings)
      ? (payload as { readings: unknown[] }).readings.length
      : 0;

  const parsed = gatewayUploadSchema.safeParse(payload);
  if (!parsed.success) {
    const seqRange = extractSequenceRange(payload);
    console.warn(
      "[telemetry] validation failed:",
      JSON.stringify({
        gateway_id: gateway.id,
        device_types: extractDeviceTypesFromPayload(payload),
        readings_length: readingsLength,
        first_sequence: seqRange.first,
        last_sequence: seqRange.last,
        issues: parsed.error.issues,
      }),
    );
    return NextResponse.json(
      { error: "Malformed upload packet", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const normalized = normalizeReadings(parsed.data.readings);
  const fieldIssues = validateNormalizedReadings(normalized);
  if (fieldIssues.length > 0) {
    const summary = summarizeSequences(normalized);
    console.warn(
      "[telemetry] validation failed:",
      JSON.stringify({
        gateway_id: gateway.id,
        device_types: summary.deviceTypes,
        readings_length: normalized.length,
        first_sequence: summary.first,
        last_sequence: summary.last,
        issues: fieldIssues,
      }),
    );
    return NextResponse.json(
      { error: "Malformed upload packet", issues: fieldIssues },
      { status: 400 },
    );
  }

  const receivedAt = new Date().toISOString();
  const result = await ingestGatewayReadings(
    createAdminClient(),
    gateway,
    normalized,
    receivedAt,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, accepted: result.accepted });
}
