const EARN_API_BASE = "https://earn.li.fi/v1/earn";

export type DurationOption = 30 | 90 | 180;

export type StrategyCard = {
  duration: DurationOption;
  label: string;
  subtitle: string;
  protocolHint?: string;
};

export type EarnVault = {
  address: string;
  chainId: number;
  network: string;
  slug: string;
  name: string;
  description?: string;
  protocol?: {
    name?: string;
    url?: string;
  };
  underlyingTokens: Array<{
    address: string;
    symbol: string;
    decimals: number;
  }>;
  analytics?: {
    apy?: {
      base?: number | null;
      reward?: number | null;
      total?: number | null;
    };
    tvl?: {
      usd?: string;
    };
    updatedAt?: string;
  };
  tags?: string[];
  depositPacks?: Array<{
    name: string;
    stepsType: string;
  }>;
  isTransactional?: boolean;
  isRedeemable?: boolean;
};

export type StrategyResult = {
  duration: DurationOption;
  protocolKey: string;
  protocolName: string;
  vaultName: string;
  vaultAddress: string;
  chainId: number;
  chainName: string;
  apy: number;
  inputToken: string;
  inputTokenAddress: string;
  inputTokenDecimals: number;
  vaultId: string;
  estimatedReturnMin: number;
  estimatedReturnMax: number;
  riskLabel: "低" | "中低";
  pointsLabel?: string;
  source: "live" | "fallback";
};

export type PortfolioPosition = {
  walletAddress: string;
  vaultAddress: string;
  chainId: number;
  vaultName: string;
  symbol: string;
  amount: string;
  amountUsd: string;
  apy: number;
};

export const strategyCards: StrategyCard[] = [
  {
    duration: 30,
    label: "30 天",
    subtitle: "短期灵活",
    protocolHint: "Aave"
  },
  {
    duration: 90,
    label: "90 天",
    subtitle: "均衡收益",
    protocolHint: "Morpho"
  },
  {
    duration: 180,
    label: "180 天",
    subtitle: "最大化收益"
  }
];

const supportedChainIds = new Set([1, 8453, 42161]);

const protocolMatchers: Record<Exclude<DurationOption, 180>, string> = {
  30: "aave",
  90: "morpho"
};

const fallbackStrategies: Record<DurationOption, StrategyResult> = {
  30: {
    duration: 30,
    protocolKey: "aave-v3",
    protocolName: "Aave",
    vaultName: "Aave USDC",
    vaultAddress: "0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c",
    chainId: 1,
    chainName: "Ethereum",
    apy: 2.37,
    inputToken: "USDC",
    inputTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    inputTokenDecimals: 6,
    vaultId: "fallback-aave-usdc",
    estimatedReturnMin: 2.54,
    estimatedReturnMax: 3.12,
    riskLabel: "低",
    source: "fallback"
  },
  90: {
    duration: 90,
    protocolKey: "morpho-v1",
    protocolName: "Morpho",
    vaultName: "STEAKUSDC",
    vaultAddress: "0xbeef01735c132ada46aa9aa4c54623caa92a64cb",
    chainId: 1,
    chainName: "Ethereum",
    apy: 2.26,
    inputToken: "USDC",
    inputTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    inputTokenDecimals: 6,
    vaultId: "fallback-morpho-usdc",
    estimatedReturnMin: 9.12,
    estimatedReturnMax: 10.4,
    riskLabel: "中低",
    pointsLabel: "含积分加成",
    source: "fallback"
  },
  180: {
    duration: 180,
    protocolKey: "morpho-v1",
    protocolName: "Morpho",
    vaultName: "BBQUSDCRESERVOIR",
    vaultAddress: "0xbeef346d7099865208ff331e4f648f4154ddaa05",
    chainId: 1,
    chainName: "Ethereum",
    apy: 3.25,
    inputToken: "USDC",
    inputTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    inputTokenDecimals: 6,
    vaultId: "fallback-top-usdc",
    estimatedReturnMin: 19.3,
    estimatedReturnMax: 22.6,
    riskLabel: "中低",
    source: "fallback"
  }
};

export async function discoverStrategy(duration: DurationOption): Promise<StrategyResult> {
  const protocolMatch = duration === 180 ? undefined : protocolMatchers[duration];
  const response = await fetch(`${EARN_API_BASE}/vaults?inputToken=USDC&pageSize=120`, {
    headers: {
      accept: "application/json"
    },
    next: { revalidate: 120 }
  });

  if (!response.ok) {
    return fallbackStrategies[duration];
  }

  const payload = (await response.json()) as { data?: EarnVault[] };
  const vaults = (payload.data ?? [])
    .filter((vault) => vault.isTransactional)
    .filter((vault) => supportedChainIds.has(vault.chainId))
    .filter((vault) => vault.underlyingTokens.some((token) => token.symbol.toUpperCase() === "USDC"))
    .filter((vault) =>
      protocolMatch ? (vault.protocol?.name ?? "").toLowerCase().includes(protocolMatch) : true
    )
    .sort((left, right) => getVaultApy(right) - getVaultApy(left));

  const winner = vaults[0];

  if (!winner) {
    return fallbackStrategies[duration];
  }

  return normalizeVault(duration, winner);
}

export async function loadPortfolioPositions(address: string): Promise<PortfolioPosition[]> {
  const response = await fetch(`${EARN_API_BASE}/portfolio/${address}/positions`, {
    headers: {
      accept: "application/json"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { positions?: Array<Record<string, unknown>> };

  return (payload.positions ?? []).flatMap((position) => {
    const walletAddress = String(position.walletAddress ?? address);
    const chainId = Number(position.chainId ?? position.networkId ?? 0);
    const vaultAddress = String(position.address ?? position.vaultAddress ?? "");
    const amount = String(position.balance ?? position.amount ?? "0");
    const amountUsd = String(position.balanceUsd ?? position.amountUsd ?? "0");
    const symbol = String(position.symbol ?? position.name ?? "Vault");
    const vaultName = String(position.name ?? position.symbol ?? "Vault Position");
    const apy = Number(position.apy ?? 0);

    if (!vaultAddress) {
      return [];
    }

    return [
      {
        walletAddress,
        vaultAddress,
        chainId,
        vaultName,
        symbol,
        amount,
        amountUsd,
        apy
      }
    ];
  });
}

export function calculateProjection(amount: number, apy: number, duration: DurationOption) {
  const yearlyReturn = amount * (apy / 100);
  const durationRatio = duration / 365;
  const baseReturn = yearlyReturn * durationRatio;

  return {
    projectedMin: Number((amount + baseReturn * 0.92).toFixed(2)),
    projectedMax: Number((amount + baseReturn * 1.08).toFixed(2)),
    yearlyValue: Number(yearlyReturn.toFixed(2))
  };
}

export function createShareText(amount: number, strategy: StrategyResult) {
  return `我把 ${amount} ${strategy.inputToken} 存进了 ${strategy.protocolName} 收益池，年化 ${strategy.apy.toFixed(
    2
  )}% ，每天都在赚钱。`;
}

function normalizeVault(duration: DurationOption, vault: EarnVault): StrategyResult {
  const protocolName = prettifyProtocolName(vault.protocol?.name) ?? "Yield Vault";
  const underlyingToken = vault.underlyingTokens.find((token) => token.symbol.toUpperCase() === "USDC");
  const apy = Number(getVaultApy(vault).toFixed(2));

  return {
    duration,
    protocolKey: vault.protocol?.name ?? "unknown",
    protocolName,
    vaultName: vault.description ? `${protocolName} / ${vault.description}` : `${protocolName} / ${vault.name}`,
    vaultAddress: vault.address,
    chainId: vault.chainId,
    chainName: vault.network,
    apy,
    inputToken: underlyingToken?.symbol ?? "USDC",
    inputTokenAddress: underlyingToken?.address ?? fallbackStrategies[duration].inputTokenAddress,
    inputTokenDecimals: underlyingToken?.decimals ?? 6,
    vaultId: vault.slug,
    estimatedReturnMin: fallbackEstimate(duration, apy).min,
    estimatedReturnMax: fallbackEstimate(duration, apy).max,
    riskLabel: duration === 30 ? "低" : "中低",
    pointsLabel: vault.depositPacks?.[0]?.name ? `${vault.depositPacks[0].name} 直达存款` : undefined,
    source: "live"
  };
}

function getVaultApy(vault: EarnVault) {
  return vault.analytics?.apy?.total ?? vault.analytics?.apy?.base ?? 0;
}

function fallbackEstimate(duration: DurationOption, apy: number) {
  const amount = 500;
  const yearly = amount * (apy / 100);
  const partial = yearly * (duration / 365);

  return {
    min: Number((partial * 0.92).toFixed(2)),
    max: Number((partial * 1.08).toFixed(2))
  };
}

function prettifyProtocolName(name?: string) {
  if (!name) {
    return undefined;
  }

  return name
    .split("-")
    .map((part) => {
      if (part === "v1" || part === "v2" || part === "v3") {
        return part.toUpperCase();
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}
