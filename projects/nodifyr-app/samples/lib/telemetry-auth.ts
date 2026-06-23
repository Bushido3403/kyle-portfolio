// Source: src/lib/telemetry/auth.ts — Bearer API key extraction and gateway authentication
import "server-only";

import type { NextRequest } from "next/server";

import {
  gatewayKeyMatches,
  hashGatewayApiKey,
} from "@/lib/crypto/gateway-key";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthenticatedGateway = {
  id: string;
  organization_id: string;
};

export function extractGatewayApiKey(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim() || null;
  }
  // Allow a dedicated header as an alternative for constrained devices.
  return request.headers.get("x-api-key");
}

/** Resolve gateway + tenant from the per-gateway API key (uploader.c sends no hardware_id). */
export async function authenticateGatewayByApiKey(
  apiKey: string,
): Promise<AuthenticatedGateway | null> {
  const admin = createAdminClient();
  const apiKeyHash = hashGatewayApiKey(apiKey);

  const { data: gateway } = await admin
    .from("iot_gateways")
    .select("id, organization_id, api_key_hash")
    .eq("api_key_hash", apiKeyHash)
    .maybeSingle();

  if (
    !gateway?.api_key_hash ||
    !gatewayKeyMatches(apiKey, gateway.api_key_hash)
  ) {
    return null;
  }

  return { id: gateway.id, organization_id: gateway.organization_id };
}
