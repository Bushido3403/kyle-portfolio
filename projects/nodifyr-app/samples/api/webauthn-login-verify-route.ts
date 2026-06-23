// Source: src/app/api/auth/webauthn/login/verify/route.ts — WebAuthn authentication ceremony, step 2
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  AUTHENTICATION_CHALLENGE_COOKIE,
  consumeChallenge,
} from "@/lib/webauthn/challenge";
import { decodePublicKey, expectedOrigin, rpID } from "@/lib/webauthn/server";

// Authentication ceremony, step 2: verify the assertion, reject cloned keys via
// the signature counter, then mint a Supabase session for the resolved user.
export async function POST(request: NextRequest) {
  const stored = await consumeChallenge(AUTHENTICATION_CHALLENGE_COOKIE);
  if (!stored) {
    return NextResponse.json(
      { error: "Challenge missing or expired" },
      { status: 400 },
    );
  }

  let body: AuthenticationResponseJSON;
  try {
    body = (await request.json()) as AuthenticationResponseJSON;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: cred } = await admin
    .from("webauthn_credentials")
    .select("user_id, public_key, sign_counter, transports")
    .eq("credential_id", body.id)
    .single();

  if (!cred) {
    return NextResponse.json(
      { error: "Unknown credential" },
      { status: 401 },
    );
  }

  const storedCounter = Number(cred.sign_counter);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: stored.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: body.id,
        publicKey: decodePublicKey(cred.public_key),
        counter: storedCounter,
        transports:
          (cred.transports ?? undefined) as
            | AuthenticatorTransportFuture[]
            | undefined,
      },
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 401 });
  }

  const { verified, authenticationInfo } = verification;
  if (!verified) {
    return NextResponse.json({ error: "Assertion rejected" }, { status: 401 });
  }

  // Cloned-authenticator defense: a non-zero counter must strictly increase.
  if (storedCounter > 0 && authenticationInfo.newCounter <= storedCounter) {
    return NextResponse.json(
      { error: "Possible cloned authenticator detected" },
      { status: 401 },
    );
  }

  await admin
    .from("webauthn_credentials")
    .update({ sign_counter: authenticationInfo.newCounter })
    .eq("credential_id", body.id);

  const { data: account } = await admin.auth.admin.getUserById(cred.user_id);
  const email = account.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Account not found" }, { status: 401 });
  }

  // Stamp AAL3 before minting the session so the new JWT carries the claim.
  await admin.auth.admin.updateUserById(cred.user_id, {
    app_metadata: { ...account.user?.app_metadata, aal_level: "AAL3" },
  });

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !link.properties?.hashed_token) {
    return NextResponse.json(
      { error: "Could not establish session" },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (otpError) {
    return NextResponse.json(
      { error: "Could not establish session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ verified: true });
}
