// API client for communicating with the backend

const API_BASE = "/api";

export interface WalletAccount {
  address: string;
  path: string;
}

export interface Wallet {
  walletId: string;
  walletName: string;
  accounts: WalletAccount[];
}

export interface Balance {
  address: string;
  usdc: string;
  usdcRaw: string;
  eth: string;
}

export interface Config {
  omnibusAddress: string;
  usdcContract: string;
  wethContract: string;
  chainId: number;
  rpcUrl: string;
}

export interface CreateWalletResponse {
  walletId: string;
  address: string;
}

export interface SweepResponse {
  success: boolean;
  txHash?: string;
  amount?: string;
  from?: string;
  to?: string;
  error?: string;
}

export interface PolicyTestResponse {
  success: boolean;
  denied: boolean;
  message?: string;
  error?: string;
}

class ApiClient {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getConfig(): Promise<Config> {
    return this.request<Config>("/config");
  }

  async getWallets(): Promise<{ wallets: Wallet[] }> {
    return this.request<{ wallets: Wallet[] }>("/wallets");
  }

  async getBalances(addresses: string[]): Promise<{ balances: Balance[] }> {
    return this.request<{ balances: Balance[] }>("/balances", {
      method: "POST",
      body: JSON.stringify({ addresses }),
    });
  }

  async createWallet(walletName?: string): Promise<CreateWalletResponse> {
    return this.request<CreateWalletResponse>("/wallets/create", {
      method: "POST",
      body: JSON.stringify({ walletName }),
    });
  }

  async sweepUsdc(fromAddress: string, amount?: string): Promise<SweepResponse> {
    return this.request<SweepResponse>("/sweep/usdc", {
      method: "POST",
      body: JSON.stringify({ fromAddress, amount }),
    });
  }

  async testPolicyDenial(fromAddress: string): Promise<PolicyTestResponse> {
    return this.request<PolicyTestResponse>("/test/policy-denial", {
      method: "POST",
      body: JSON.stringify({ fromAddress }),
    });
  }

  async testPolicyDenialWrongAddress(fromAddress: string): Promise<PolicyTestResponse> {
    return this.request<PolicyTestResponse>("/test/policy-denial-wrong-address", {
      method: "POST",
      body: JSON.stringify({ fromAddress }),
    });
  }
}

export const api = new ApiClient();

