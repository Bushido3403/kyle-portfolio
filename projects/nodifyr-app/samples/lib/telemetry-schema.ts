// Source: src/lib/telemetry/schema.ts — Zod validation schemas for IoT gateway uplinks
import { z } from "zod";

import { KNOWN_DEVICE_TYPES } from "./device-types";

/** Matches CONFIG_NODIFYR_UPLOAD_BATCH_MAX in firmware menuconfig. */
export const MAX_READINGS_BATCH = 64;

const macAddressSchema = z
  .string()
  .transform((value) => value.toLowerCase())
  .pipe(
    z.string().regex(
      /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/,
      "mac must be hex with colons (aa:bb:cc:dd:ee:ff)",
    ),
  );

const readingBaseSchema = {
  ts: z.number().int().min(0).max(4_294_967_295),
  rssi: z.number().int().min(-128).max(127),
  mac: macAddressSchema,
  sequence: z.number().int().min(0).max(65535),
};

/** Profile 1 — legacy flat climate JSON (backward compatible). */
const legacyClimateReadingSchema = z
  .object({
    ...readingBaseSchema,
    node_id: z.number().int().min(0).max(65535),
    temperature: z.number().int().min(-32768).max(32767),
    humidity: z.number().int().min(0).max(100),
    battery: z.number().int().min(0).max(100),
  })
  .strict();

/** Profile 2+ — device_type + generic numeric fields bag. */
const typedReadingSchema = z
  .object({
    ...readingBaseSchema,
    device_type: z.enum(KNOWN_DEVICE_TYPES as [string, ...string[]]),
    fields: z.record(z.string(), z.number()),
  })
  .strict();

export const gatewayReadingSchema = z.union([
  legacyClimateReadingSchema,
  typedReadingSchema,
]);

// Gateway uplink batch from uploader.c (ESP32/nRF). Accepts legacy climate
// readings and typed device_type + fields readings in the same batch.
export const gatewayUploadSchema = z
  .object({
    readings: z
      .array(gatewayReadingSchema)
      .min(1)
      .max(MAX_READINGS_BATCH),
  })
  .strict();

export type GatewayReadingInput = z.infer<typeof gatewayReadingSchema>;
export type GatewayUpload = z.infer<typeof gatewayUploadSchema>;

/** @deprecated Use GatewayReadingInput — kept for internal references during transition */
export type GatewayReading = GatewayReadingInput;
