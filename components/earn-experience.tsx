"use client";

import html2canvas from "html2canvas";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { erc20Abi, formatUnits, parseUnits, type Address, type Hash, type Hex } from "viem";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSendTransaction,
  useSwitchChain,
  useWriteContract
} from "wagmi";
import { getExplorerUrl } from "@/lib/chains";
import {
  calculateProjection,
  createShareText,
  strategyCards,
  type DurationOption,
  type PortfolioPosition,
  type StrategyResult
} from "@/lib/earn";

type FlowStep = "idle" | "analyzing" | "amount" | "depositing" | "success";

type PositionPayload = {
  earned: number;
  yearlyYield: number;
  updatedAt: number;
};

type QuotePayload = {
  transactionId: string;
  estimate: {
    approvalAddress?: string;
    toAmount?: string;
    toAmountMin?: string;
    gasCosts?: Array<{
      amountUSD?: string;
    }>;
  };
  transactionRequest: {
    to: string;
    data: string;
    value?: string;
    gasLimit?: string;
    gasPrice?: string;
    chainId: number;
  };
};

const analysisMessages = [
  "分析你偏好的期限与熟悉度",
  "筛选最适合普通用户的收益池",
  "平衡收益、流动性与风险"
];

export function EarnExperience() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  const [selectedDuration, setSelectedDuration] = useState<DurationOption | null>(null);
  const [step, setStep] = useState<FlowStep>("idle");
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [amount, setAmount] = useState("500");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [approvalState, setApprovalState] = useState<"idle" | "active" | "complete">("idle");
  const [depositState, setDepositState] = useState<"idle" | "active" | "complete">("idle");
  const [approvalHash, setApprovalHash] = useState<Hash | null>(null);
  const [depositHash, setDepositHash] = useState<Hash | null>(null);
  const [depositedAt, setDepositedAt] = useState<number | null>(null);
  const [position, setPosition] = useState<PositionPayload | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuotePayload | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioMessage, setPortfolioMessage] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const numericAmount = Number(amount || 0);
  const projections = useMemo(() => {
    if (!strategy) {
      return null;
    }

    return calculateProjection(numericAmount, strategy.apy, strategy.duration);
  }, [numericAmount, strategy]);

  const quotedReceive = useMemo(() => {
    if (!quote || !strategy) {
      return null;
    }

    const decimals = strategy.inputTokenDecimals;

    return {
      best: Number(formatUnits(BigInt(quote.estimate.toAmount ?? "0"), decimals)).toFixed(4),
      minimum: Number(formatUnits(BigInt(quote.estimate.toAmountMin ?? "0"), decimals)).toFixed(4)
    };
  }, [quote, strategy]);

  useEffect(() => {
    if (step !== "success" || !strategy || !depositedAt || !numericAmount) {
      return;
    }

    let isCancelled = false;

    const loadPosition = async () => {
      const response = await fetch(
        `/api/position?amount=${numericAmount}&apy=${strategy.apy}&depositedAt=${depositedAt}`
      );
      const payload = (await response.json()) as PositionPayload;

      if (!isCancelled) {
        setPosition(payload);
      }
    };

    loadPosition();
    const timer = window.setInterval(loadPosition, 3000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [depositedAt, numericAmount, step, strategy]);

  useEffect(() => {
    if (!strategy || !numericAmount || !address) {
      setQuote(null);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const response = await fetch("/api/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fromChain: strategy.chainId,
            toChain: strategy.chainId,
            fromToken: strategy.inputTokenAddress,
            toToken: strategy.vaultAddress,
            fromAmount: parseUnits(amount, strategy.inputTokenDecimals).toString(),
            fromAddress: address,
            toAddress: address
          })
        });

        const payload = (await response.json()) as QuotePayload & { message?: string };

        if (!response.ok) {
          throw new Error(payload.message ?? "Quote request failed.");
        }

        setQuote(payload);
      } catch (quoteIssue) {
        setQuote(null);
        setQuoteError(quoteIssue instanceof Error ? quoteIssue.message : "暂时无法生成存款报价。");
      } finally {
        setQuoteLoading(false);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [address, amount, numericAmount, strategy]);

  const chooseDuration = async (duration: DurationOption) => {
    setSelectedDuration(duration);
    setStep("analyzing");
    setIsLoading(true);
    setStrategy(null);
    setError(null);
    setShareMessage(null);
    setStatusMessage(null);
    setApprovalHash(null);
    setDepositHash(null);
    setPortfolioPositions([]);
    setPortfolioMessage(null);

    try {
      const response = await fetch(`/api/strategy?duration=${duration}`);
      if (!response.ok) {
        throw new Error("Strategy request failed.");
      }

      const payload = (await response.json()) as StrategyResult;

      window.setTimeout(() => {
        setStrategy(payload);
        setStep("amount");
        setIsLoading(false);
      }, 1400);
    } catch {
      setError("暂时没拿到实时策略，已为你切换到 demo 推荐。");
      setStrategy(null);
      setStep("idle");
      setIsLoading(false);
    }
  };

  const beginDeposit = async () => {
    if (!strategy || !numericAmount || !address || !quote || !publicClient) {
      return;
    }

    try {
      setError(null);
      setStatusMessage("准备校验链、授权与存款交易。");
      setStep("depositing");
      setApprovalState("active");
      setDepositState("idle");
      setShareMessage(null);
      setPortfolioMessage(null);

      if (chainId !== strategy.chainId) {
        setStatusMessage(`正在切换到 ${strategy.chainName}...`);
        await switchChainAsync({ chainId: strategy.chainId });
      }

      const approvalAddress = quote.estimate.approvalAddress as Address | undefined;
      const amountRaw = parseUnits(amount, strategy.inputTokenDecimals);

      if (approvalAddress) {
        const allowance = (await publicClient.readContract({
          address: strategy.inputTokenAddress as Address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address as Address, approvalAddress]
        })) as bigint;

        if (allowance < amountRaw) {
          setStatusMessage("等待钱包确认授权。");
          const approved = await writeContractAsync({
            address: strategy.inputTokenAddress as Address,
            abi: erc20Abi,
            functionName: "approve",
            args: [approvalAddress, amountRaw],
            account: address as Address,
            chainId: strategy.chainId
          });

          setApprovalHash(approved);
          await publicClient.waitForTransactionReceipt({ hash: approved });
        }
      }

      setApprovalState("complete");
      setDepositState("active");
      setStatusMessage("授权完成，正在提交存款交易。");

      const transactionRequest = quote.transactionRequest;
      const hash = await sendTransactionAsync({
        account: address as Address,
        chainId: transactionRequest.chainId,
        to: transactionRequest.to as Address,
        data: transactionRequest.data as Hex,
        value: transactionRequest.value ? BigInt(transactionRequest.value) : BigInt(0),
        gas: transactionRequest.gasLimit ? BigInt(transactionRequest.gasLimit) : undefined,
        gasPrice: transactionRequest.gasPrice ? BigInt(transactionRequest.gasPrice) : undefined
      });

      setDepositHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      setDepositState("complete");
      const timestamp = Date.now();
      setDepositedAt(timestamp);
      setPosition({
        earned: 0.000041,
        yearlyYield: projections?.yearlyValue ?? 0,
        updatedAt: timestamp
      });
      setStatusMessage("链上存款已确认。");
      setStep("success");
      await refreshPortfolio(address);
    } catch (transactionIssue) {
      setError(transactionIssue instanceof Error ? transactionIssue.message : "存款流程中断。");
      setStatusMessage(null);
      setStep("amount");
      setApprovalState("idle");
      setDepositState("idle");
    }
  };

  const refreshPortfolio = async (targetAddress = address) => {
    if (!targetAddress) {
      return;
    }

    setPortfolioLoading(true);
    setPortfolioMessage(null);

    try {
      const response = await fetch(`/api/portfolio?address=${targetAddress}`);
      const payload = (await response.json()) as {
        positions?: PortfolioPosition[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Portfolio request failed.");
      }

      setPortfolioPositions(payload.positions ?? []);
      setPortfolioMessage(
        (payload.positions ?? []).length
          ? "已从 LI.FI Earn portfolio 拉取到实时持仓。"
          : "暂时还没抓到持仓，链上索引可能还在同步。"
      );
    } catch (portfolioIssue) {
      setPortfolioMessage(
        portfolioIssue instanceof Error ? portfolioIssue.message : "暂时无法读取 portfolio。"
      );
    } finally {
      setPortfolioLoading(false);
    }
  };

  const shareCard = async () => {
    if (!strategy || !shareCardRef.current) {
      return;
    }

    const canvas = await html2canvas(shareCardRef.current, {
      backgroundColor: "#f4efe6",
      scale: 2
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "warm-yield-share-card.png";
    link.click();

    const text = createShareText(numericAmount, strategy);

    try {
      await navigator.clipboard.writeText(`${text} 你也来试试 -> ${window.location.href}`);
      setShareMessage("分享卡片已生成，并已复制分享文案。");
    } catch {
      setShareMessage("分享卡片已生成。");
    }
  };

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 lg:px-10">
        <div className="display text-xl tracking-[0.2em] text-cocoa">EarnGift</div>
        <div className="flex items-center gap-4">
          <nav className="mono hidden items-center gap-8 text-xs uppercase tracking-[0.25em] text-muted md:flex">
            <a href="#flow" className="transition hover:text-caramel">
              Flow
            </a>
            <a href="#why" className="transition hover:text-caramel">
              Why it wins
            </a>
            <a
              href="https://docs.li.fi/earn/recipes/discover-and-deposit"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-caramel"
            >
              LiFi docs
            </a>
          </nav>
          <ConnectButton />
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-12 px-6 pb-20 lg:px-10">
        <section className="section-line pt-10 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
            <div className="space-y-8">
              <p className="mono animate-float-up text-xs uppercase tracking-[0.28em] text-caramel">
                Defi UX Challenge / Warm orange minimal banking
              </p>
              <div className="space-y-6">
                <h1 className="display max-w-5xl text-5xl leading-[0.92] text-cocoa sm:text-6xl lg:text-[7.2rem]">
                  存钱。
                  <br />
                  看它慢慢变多。
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                  不讲复杂术语，不塞一堆选项。只回答你想存多久，我们就帮你把钱放到更合适的收益池里。像看储蓄账户一样简单。
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <a href="#flow" className="button-primary px-6 py-4 mono text-sm uppercase tracking-[0.18em]">
                  开始存钱
                </a>
                <a href="#why" className="button-secondary px-6 py-4 mono text-sm uppercase tracking-[0.18em]">
                  为什么好懂
                </a>
              </div>
              <div className="grid max-w-3xl gap-4 pt-2 sm:grid-cols-3">
                <Metric label="适合谁" value="第一次用 DeFi 的人" />
                <Metric label="怎么验证" value="Scan / Portfolio" />
                <Metric label="体验目标" value="奶奶也看得懂" />
              </div>
            </div>

            <div className="coin-stage">
              <DollarCoin />
            </div>
          </div>
        </section>

        <section id="flow" className="section-line grid gap-8 pt-8 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="space-y-5">
            <p className="mono text-xs uppercase tracking-[0.28em] text-caramel">Five-step Flow</p>
            <h2 className="display text-4xl leading-tight sm:text-5xl">像填一张温和的存款单，而不是在学协议。</h2>
            <p className="max-w-xl text-base leading-8 text-muted">
              整个流程只保留普通用户真正关心的信息：存多久、放哪、预估能多一点多少、现在是不是已经存成功。
            </p>
          </div>

          <div className="receipt-card rounded-md p-6 sm:p-8">
            {error ? (
              <div className="mb-5 border border-caramel/25 bg-caramel/10 px-4 py-3 text-sm text-cocoa">
                {error}
              </div>
            ) : null}

            {statusMessage ? (
              <div className="mb-5 border border-[var(--line)] bg-[rgba(255,252,248,0.5)] px-4 py-3 text-sm text-cocoa">
                {statusMessage}
              </div>
            ) : null}

            {(step === "idle" || step === "analyzing") && (
              <div className="space-y-6 animate-float-up">
                <div className="border-b border-[var(--line)] pb-4">
                  <p className="mono text-[11px] uppercase tracking-[0.25em] text-muted">Step 1</p>
                  <h3 className="display mt-3 text-3xl">你想存多久？</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">选一个就好，不需要下一步按钮。</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {strategyCards.map((card) => {
                    const active = selectedDuration === card.duration;

                    return (
                      <button
                        key={card.duration}
                        type="button"
                        onClick={() => chooseDuration(card.duration)}
                        className={`group border p-5 text-left transition duration-300 ease-in-out ${
                          active
                            ? "border-caramel bg-white/60"
                            : "border-[var(--line)] bg-white/40 hover:-translate-y-1 hover:border-caramel/45 hover:bg-caramel/5"
                        }`}
                      >
                        <div className="mono text-[11px] uppercase tracking-[0.24em] text-muted">{card.subtitle}</div>
                        <div className="display mt-6 text-4xl">{card.label}</div>
                        <div className="mt-6 flex items-center justify-between">
                          <span className="text-sm text-muted">
                            {card.protocolHint ? `${card.protocolHint} 优先` : "支持链中最高 APY"}
                          </span>
                          <span className="h-px w-12 bg-caramel/55 transition group-hover:w-16" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {step === "analyzing" && (
                  <div className="border border-[var(--line)] bg-white/50 p-5">
                    <p className="mono text-[11px] uppercase tracking-[0.24em] text-caramel">Step 2</p>
                    <h4 className="display mt-3 text-2xl">我们帮你选最优方案</h4>
                    <div className="mt-5 space-y-3">
                      {analysisMessages.map((message) => (
                        <div key={message} className="flex items-center gap-3">
                          <span className="h-px w-12 animate-pulse-line bg-caramel/50" />
                          <span className="text-sm text-muted">{message}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-5 text-sm text-muted">{isLoading ? "正在连接 LI.FI Earn 数据..." : "分析完成。"}</p>
                  </div>
                )}
              </div>
            )}

            {step === "amount" && strategy && (
              <div className="space-y-6 animate-float-up">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
                  <div>
                    <p className="mono text-[11px] uppercase tracking-[0.25em] text-muted">Step 2</p>
                    <h3 className="display mt-3 text-3xl">我们已经替你挑好了</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">你只需要看一眼方案，再输入想存的金额。</p>
                  </div>
                  <span className="mono rounded-full border border-[var(--line)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-caramel">
                    {strategy.source === "live" ? "Live data" : "Fallback"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DataTile label="为你匹配的策略" value={strategy.vaultName} hint={`${strategy.protocolName} / ${strategy.chainName}`} />
                  <DataTile label="预期年化" value={`${strategy.apy.toFixed(2)}%`} hint={strategy.pointsLabel ?? `风险等级：${strategy.riskLabel}`} />
                  <DataTile
                    label={`存 ${strategy.duration} 天可赚`}
                    value={`约 $${strategy.estimatedReturnMin.toFixed(2)} - $${strategy.estimatedReturnMax.toFixed(2)}`}
                    hint="按实时 APY 粗略估算"
                  />
                  <DataTile label="存入资产" value={strategy.inputToken} hint={`Chain ${strategy.chainId} / ${strategy.vaultAddress.slice(0, 8)}...`} />
                </div>

                <label className="block space-y-3 border-t border-[var(--line)] pt-2">
                  <span className="mono text-[11px] uppercase tracking-[0.24em] text-muted">你想存多少？</span>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
                    inputMode="decimal"
                    placeholder="500"
                    className="field display text-4xl"
                  />
                </label>

                <div className="border border-[var(--line)] bg-white/45 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="mono text-[11px] uppercase tracking-[0.25em] text-muted">Deposit Slip</p>
                      <h4 className="display mt-3 text-2xl">这次存款会这样发生</h4>
                    </div>
                    <span className="mono text-[11px] uppercase tracking-[0.22em] text-muted">
                      {quoteLoading ? "Loading" : quote ? "Ready" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <DataTile
                      label="你将存入"
                      value={`${numericAmount || 0} ${strategy.inputToken}`}
                      hint={isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "先连接钱包以生成实时报价"}
                    />
                    <DataTile
                      label="预计到手"
                      value={
                        quotedReceive
                          ? `${quotedReceive.minimum} - ${quotedReceive.best} ${strategy.inputToken}`
                          : projections
                            ? `$${projections.projectedMin} - $${projections.projectedMax}`
                            : "-"
                      }
                      hint={quote ? "来自真实 Composer quote" : "未连接钱包时显示本地估算"}
                    />
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <DataTile
                      label="预计 Gas"
                      value={
                        quote?.estimate.gasCosts?.[0]?.amountUSD
                          ? `$${Number(quote.estimate.gasCosts[0].amountUSD).toFixed(4)}`
                          : "-"
                      }
                      hint="只做展示，实际 gas 以钱包签名时为准"
                    />
                    <DataTile
                      label="授权对象"
                      value={quote?.estimate.approvalAddress ? `${quote.estimate.approvalAddress.slice(0, 6)}...${quote.estimate.approvalAddress.slice(-4)}` : "-"}
                      hint="若额度不足，会先请求一次授权"
                    />
                  </div>
                  {quoteError ? <p className="mt-5 text-sm text-cocoa">{quoteError}</p> : null}
                  <button
                    type="button"
                    onClick={beginDeposit}
                    disabled={!numericAmount || !isConnected || !quote || quoteLoading}
                    className="button-primary mt-6 w-full px-6 py-4 mono text-sm uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isConnected ? "确认并开始存款" : "先连接钱包"}
                  </button>
                </div>
              </div>
            )}

            {step === "depositing" && strategy && (
              <div className="space-y-6 animate-float-up">
                <div className="border-b border-[var(--line)] pb-4">
                  <p className="mono text-[11px] uppercase tracking-[0.25em] text-muted">Step 3</p>
                  <h3 className="display mt-3 text-3xl">你的资金正在开始工作</h3>
                </div>

                <div className="space-y-4 border border-[var(--line)] bg-white/45 p-5">
                  <ProgressRow
                    title="第一步：授权资金"
                    state={approvalState === "complete" ? "complete" : approvalState === "active" ? "active" : "pending"}
                    hash={approvalHash}
                    scanUrl={approvalHash && strategy ? getExplorerUrl(strategy.chainId, approvalHash) : undefined}
                  />
                  <ProgressRow
                    title="第二步：存入收益池"
                    state={depositState === "complete" ? "complete" : depositState === "active" ? "active" : "pending"}
                    hash={depositHash}
                    scanUrl={depositHash && strategy ? getExplorerUrl(strategy.chainId, depositHash) : undefined}
                  />
                </div>
              </div>
            )}

            {step === "success" && strategy && position && depositedAt && (
              <div className="space-y-6 animate-float-up">
                <div className="border-b border-[var(--line)] pb-4">
                  <p className="mono text-[11px] uppercase tracking-[0.25em] text-caramel">Step 4</p>
                  <h3 className="display mt-3 text-4xl">存款成功</h3>
                  <p className="mt-3 text-base text-muted">
                    你的 {numericAmount} {strategy.inputToken} 已经开始工作。
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <DataTile label="今天已赚" value={`$${position.earned.toFixed(6)}`} hint="每 3 秒自动刷新" large />
                  <DataTile label="年化收益" value={`$${position.yearlyYield.toFixed(2)} / 年`} hint={`${strategy.apy.toFixed(2)}% APY`} />
                  <DataTile label="存入时间" value={new Date(depositedAt).toLocaleString("zh-CN")} hint="链上开始计息" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DataTile
                    label="授权交易"
                    value={approvalHash ? `${approvalHash.slice(0, 10)}...` : "已跳过"}
                    hint={approvalHash && strategy ? "可点击下方 Scan 查看" : "若额度已足够，授权步骤会被跳过"}
                  />
                  <DataTile
                    label="存款交易"
                    value={depositHash ? `${depositHash.slice(0, 10)}...` : "-"}
                    hint={depositHash && strategy ? "已上链，可用于验证" : "等待交易哈希"}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  {approvalHash && strategy ? (
                    <a
                      href={getExplorerUrl(strategy.chainId, approvalHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="button-secondary px-5 py-3 mono text-sm uppercase tracking-[0.18em]"
                    >
                      查看授权 Scan
                    </a>
                  ) : null}
                  {depositHash && strategy ? (
                    <a
                      href={getExplorerUrl(strategy.chainId, depositHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="button-secondary px-5 py-3 mono text-sm uppercase tracking-[0.18em]"
                    >
                      查看存款 Scan
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => refreshPortfolio()}
                    className="button-secondary px-5 py-3 mono text-sm uppercase tracking-[0.18em]"
                  >
                    {portfolioLoading ? "读取中..." : "验证 Portfolio"}
                  </button>
                </div>

                <div className="border border-[var(--line)] bg-white/45 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="mono text-[11px] uppercase tracking-[0.25em] text-muted">Verification</p>
                      <h4 className="display mt-3 text-2xl">LI.FI Earn Portfolio 验证</h4>
                    </div>
                    <span className="mono text-[11px] uppercase tracking-[0.22em] text-muted">
                      {portfolioPositions.length} positions
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-muted">
                    {portfolioMessage ?? "点击按钮后，会请求 LI.FI Earn positions 接口读取你的持仓。"}
                  </p>
                  <div className="mt-5 space-y-3">
                    {portfolioPositions.length ? (
                      portfolioPositions.map((item) => (
                        <div key={`${item.chainId}-${item.vaultAddress}`} className="border border-[var(--line)] bg-white/40 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="display text-2xl">{item.vaultName}</div>
                              <div className="mt-2 text-sm text-muted">{item.vaultAddress}</div>
                            </div>
                            <div className="text-right">
                              <div className="display text-2xl">{item.amountUsd}</div>
                              <div className="mt-2 text-sm text-muted">{item.symbol}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="border border-dashed border-[var(--line)] p-4 text-sm text-muted">
                        暂未返回持仓。新交易有时需要一点索引时间。
                      </div>
                    )}
                  </div>
                  {address ? (
                    <pre className="mt-5 overflow-x-auto border border-[var(--line)] bg-[rgba(255,252,248,0.55)] p-4 text-xs text-cocoa">
{`curl -X GET 'https://earn.li.fi/v1/earn/portfolio/${address}/positions'`}
                    </pre>
                  ) : null}
                </div>

                <div
                  ref={shareCardRef}
                  className="relative overflow-hidden border border-[var(--line)] bg-white/60 p-6"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-[var(--line)]" />
                  <p className="mono text-[11px] uppercase tracking-[0.25em] text-caramel">Share Card</p>
                  <h4 className="display mt-3 text-3xl">我把 {numericAmount} USDC 存进了收益池</h4>
                  <p className="mt-4 text-base leading-8 text-muted">
                    年化 {strategy.apy.toFixed(2)}%，每天都在赚钱。你也来试试。
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
                    <span className="mono text-xs uppercase tracking-[0.22em] text-muted">Warm Yield</span>
                    <span className="mono text-xs uppercase tracking-[0.22em] text-caramel">LIFI Earn</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={shareCard} className="button-secondary px-5 py-3 mono text-sm uppercase tracking-[0.18em]">
                    邀请朋友一起存
                  </button>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `${createShareText(numericAmount, strategy)} 你也来试试 -> ${typeof window !== "undefined" ? window.location.href : ""}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="button-secondary px-5 py-3 mono text-sm uppercase tracking-[0.18em]"
                  >
                    分享到 X
                  </a>
                </div>

                {shareMessage ? <p className="text-sm text-muted">{shareMessage}</p> : null}
              </div>
            )}
          </div>
        </section>

        <section id="why" className="section-line grid gap-6 pb-8 pt-8 md:grid-cols-3">
          <FeatureBlock
            index="01"
            title="普通用户语义"
            body="把复杂的协议动作翻译成「授权资金」和「存入收益池」，把 DeFi 决策浓缩成普通人能理解的时间偏好选择。"
          />
          <FeatureBlock
            index="02"
            title="真实执行链路"
            body="策略来自 LI.FI Earn，存款报价来自 Composer，钱包连接使用 RainbowKit，交易完成后直接给出 scan 与 portfolio 双重验证路径。"
          />
          <FeatureBlock
            index="03"
            title="演示与验证兼顾"
            body="现场 demo 时能看到 quote、授权、存款、收益跳动；评委追问时也能立刻打开 tx scan，或调用 Earn positions 接口确认结果。"
          />
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--line)] bg-[rgba(255,252,248,0.4)] p-4">
      <div className="mono text-[11px] uppercase tracking-[0.24em] text-muted">{label}</div>
      <div className="display mt-4 text-2xl">{value}</div>
    </div>
  );
}

function DataTile({
  label,
  value,
  hint,
  large
}: {
  label: string;
  value: string;
  hint: string;
  large?: boolean;
}) {
  return (
    <div className="border border-[var(--line)] bg-[rgba(255,252,248,0.35)] p-4">
      <div className="mono text-[11px] uppercase tracking-[0.24em] text-muted">{label}</div>
      <div className={`display mt-4 break-words ${large ? "text-4xl" : "text-2xl"}`}>{value}</div>
      <div className="mt-4 text-sm text-muted">{hint}</div>
    </div>
  );
}

function ProgressRow({
  title,
  state,
  hash,
  scanUrl
}: {
  title: string;
  state: "complete" | "active" | "pending";
  hash?: string | null;
  scanUrl?: string;
}) {
  const text = state === "complete" ? "完成" : state === "active" ? "处理中..." : "等待中";

  return (
    <div className="border-b border-[var(--line)] pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center border text-sm ${
              state === "complete"
                ? "border-[rgba(111,123,87,0.45)] text-[var(--success)]"
                : state === "active"
                  ? "border-caramel text-caramel"
                  : "border-[var(--line)] text-muted"
            }`}
          >
            {state === "complete" ? "✓" : state === "active" ? "⟳" : "·"}
          </span>
          <span className="text-base">{title}</span>
        </div>
        <span className="mono text-xs uppercase tracking-[0.22em] text-muted">{text}</span>
      </div>
      {hash ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span className="mono">{hash}</span>
          {scanUrl ? (
            <a href={scanUrl} target="_blank" rel="noreferrer" className="text-caramel underline-offset-4 hover:underline">
              打开 Scan
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FeatureBlock({
  index,
  title,
  body
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div className="border border-[var(--line)] bg-[rgba(255,252,248,0.35)] p-6">
      <p className="mono text-[11px] uppercase tracking-[0.28em] text-caramel">{index}</p>
      <h3 className="display mt-4 text-3xl">{title}</h3>
      <p className="mt-4 text-base leading-8 text-muted">{body}</p>
    </div>
  );
}

function DollarCoin() {
  return (
    <div className="coin-spin" aria-hidden="true">
      <div className="coin-rings" />
      <div className="coin-face">
        <div className="coin-mark">$</div>
      </div>
      <div className="coin-edge" />
      <div className="coin-back">
        <div className="coin-mark">$</div>
      </div>
    </div>
  );
}
