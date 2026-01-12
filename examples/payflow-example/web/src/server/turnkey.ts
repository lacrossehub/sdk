import { Turnkey } from "@turnkey/sdk-server";

export function getTurnkeyClient() {
  return new Turnkey({
    apiBaseUrl: process.env.BASE_URL ?? "https://api.turnkey.com",
    apiPublicKey: process.env.MERCHANTS_API_PUBLIC_KEY!,
    apiPrivateKey: process.env.MERCHANTS_API_PRIVATE_KEY!,
    defaultOrganizationId: process.env.ORGANIZATION_ID!,
  });
}

