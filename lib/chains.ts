import { arbitrum, base, mainnet } from "wagmi/chains";

export const supportedChains = [mainnet, base, arbitrum] as const;

export function getExplorerUrl(chainId: number, hash: string) {
  const chain = supportedChains.find((candidate) => candidate.id === chainId);
  const baseUrl = chain?.blockExplorers?.default.url;

  return baseUrl ? `${baseUrl}/tx/${hash}` : undefined;
}
