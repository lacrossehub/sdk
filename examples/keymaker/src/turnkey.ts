import { Turnkey } from "@turnkey/sdk-server";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from `.env.local`
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

let turnkeyClient: Turnkey | null = null;

export function getTurnkeyClient(): Turnkey {
  if (turnkeyClient) {
    return turnkeyClient;
  }

  const apiPublicKey = process.env.API_PUBLIC_KEY;
  const apiPrivateKey = process.env.API_PRIVATE_KEY;
  const organizationId = process.env.ORGANIZATION_ID;
  const baseUrl = process.env.BASE_URL ?? "https://api.turnkey.com";

  if (!apiPublicKey || !apiPrivateKey || !organizationId) {
    console.error("Missing required environment variables:");
    if (!apiPublicKey) console.error("  - API_PUBLIC_KEY");
    if (!apiPrivateKey) console.error("  - API_PRIVATE_KEY");
    if (!organizationId) console.error("  - ORGANIZATION_ID");
    console.error("\nMake sure .env.local is configured correctly.");
    process.exit(1);
  }

  turnkeyClient = new Turnkey({
    apiBaseUrl: baseUrl,
    apiPublicKey,
    apiPrivateKey,
    defaultOrganizationId: organizationId,
  });

  return turnkeyClient;
}

export function getOrganizationId(): string {
  return process.env.ORGANIZATION_ID!;
}
