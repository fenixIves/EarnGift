"use client";

import html2canvas from "html2canvas";
import { AnimatePresence, motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, ArrowUpRight, ShieldCheck, Orbit, Waves, Wallet2 } from "lucide-react";
import { erc20Abi, formatUnits, parseUnits, type Address, type Hash, type Hex } from "viem";
import { Fragment, forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

gsap.registerPlugin(ScrollTrigger);

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
  "Reading your preferred time horizon",
  "Finding the most suitable yield vault",
  "Balancing yield, liquidity, and risk"
];

const promiseBlocks = [
  {
    index: "01",
    title: "No more DeFi jargon",
    body: "Users should not need to understand APY, TVL, vaults, or liquidity pools before they can start earning."
  },
  {
    index: "02",
    title: "Pick a duration, not a protocol",
    body: "Instead of comparing dozens of strategies, users answer one simple question: how long do you want to save?"
  },
  {
    index: "03",
    title: "See your money grow in real time",
    body: "After deposit, the experience turns into a live earnings view so growth feels visible instead of abstract."
  }
];

const flowMoments = [
  {
    title: "Pick a horizon",
    copy: "Users choose 30, 90, or 180 days. The system translates that simple answer into the best matching strategy.",
    icon: Orbit
  },
  {
    title: "Quote the route",
    copy: "Before signing, users can see the deposit amount, estimated value, gas, and approval route in one place.",
    icon: Waves
  },
  {
    title: "Track the proof",
    copy: "Transaction hashes, portfolio checks, and share actions make the full deposit journey visible and trustworthy.",
    icon: ShieldCheck
  }
];

const faqItems = [
  {
    question: "Is EarnGift custodial?",
    answer: "No. Your funds stay in your wallet flow and move through non-custodial strategies. The product simplifies the experience, not ownership."
  },
  {
    question: "Why focus on 30 / 90 / 180 days?",
    answer: "Time is easier to understand than protocol mechanics. Users make one simple choice, and the system maps that to a strategy."
  },
    {
        question: 'What\'s the minimum deposit?',
        answer: 'There is no minimum. Start with any amount that makes sense for you—whether it\'s $10 or $10,000.',
    },
    {
        question: 'Which networks are supported?',
        answer: 'We support Ethereum, Arbitrum, Base, and Polygon. More chains coming soon based on community demand.',
    },
    {
        question: 'How is the yield generated?',
        answer: 'We aggregate yields from 20+ battle-tested DeFi protocols. Our system automatically routes your funds to the best opportunities while maintaining strict risk parameters.',
    },
    {
        question: 'Are there any fees?',
        answer: 'We charge a small performance fee only on the yield generated—never on your principal. No hidden fees, no withdrawal charges.',
    },
];

export function EarnExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showInviteCard, setShowInviteCard] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    setCurrentUrl(window.location.href);
  }, []);

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-story-section]");
      sections.forEach((section, index) => {
        const chunks = section.querySelectorAll<HTMLElement>("[data-reveal-chunk]");
        gsap.fromTo(
          chunks,
          { opacity: 0, y: 80, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              end: "top 30%",
              scrub: index === 0 ? false : 0.9
            }
          }
        );

        gsap.fromTo(
          section,
          { opacity: 0.55 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom center",
              scrub: true
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax='slow']").forEach((node) => {
        gsap.to(node, {
          yPercent: -14,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true
          }
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax='fast']").forEach((node) => {
        gsap.to(node, {
          yPercent: -28,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true
          }
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-progress-line]").forEach((node) => {
        gsap.fromTo(
          node,
          { scaleX: 0.2, opacity: 0.2 },
          {
            scaleX: 1,
            opacity: 1,
            transformOrigin: "left center",
            ease: "none",
            scrollTrigger: {
              trigger: node,
              start: "top 86%",
              end: "bottom 45%",
              scrub: true
            }
          }
        );
      });

      ScrollTrigger.refresh();
    }, rootRef);

    return () => ctx.revert();
  }, []);

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
        setQuoteError(quoteIssue instanceof Error ? quoteIssue.message : "Unable to generate a deposit quote right now.");
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
      setError("Live strategy data is unavailable right now. Switched to the demo recommendation.");
      setStrategy(null);
      setStep("idle");
      setIsLoading(false);
    }
  };

  const beginDeposit = async () => {
    if (!strategy || !numericAmount || !address || !quote || !publicClient) {
      return;
    }

    document.getElementById("flow")?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      setError(null);
      setStatusMessage("Checking the chain, approval, and deposit transaction.");
      setStep("depositing");
      setApprovalState("active");
      setDepositState("idle");
      setShareMessage(null);
      setPortfolioMessage(null);

      if (chainId !== strategy.chainId) {
        setStatusMessage(`Switching to ${strategy.chainName}...`);
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
          setStatusMessage("Waiting for wallet approval.");
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
      setStatusMessage("Approval complete. Submitting the deposit transaction.");

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
      setStatusMessage("Deposit confirmed on-chain.");
      setStep("success");
      await refreshPortfolio(address);
    } catch (transactionIssue) {
      setError(transactionIssue instanceof Error ? transactionIssue.message : "The deposit flow was interrupted.");
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
          ? "Loaded a live position from the LI.FI Earn portfolio."
          : "No position found yet. Indexing may still be in progress."
      );
    } catch (portfolioIssue) {
      setPortfolioMessage(
        portfolioIssue instanceof Error ? portfolioIssue.message : "Unable to load the portfolio right now."
      );
    } finally {
      setPortfolioLoading(false);
    }
  };

  const downloadShareCard = async () => {
    if (!strategy || !shareCardRef.current) {
      return;
    }

    const canvas = await html2canvas(shareCardRef.current, {
      backgroundColor: "#07111f",
      scale: 2
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "earngift-share-card.png";
    link.click();

    const text = createShareText(numericAmount, strategy);

    try {
      await navigator.clipboard.writeText(`${text} Try it here -> ${currentUrl}`);
      setShareMessage("Share card downloaded and share text copied to clipboard.");
    } catch {
      setShareMessage("Share card downloaded.");
    }
  };

  const openShareModal = () => {
    setShowInviteCard(true);
  };

  return (
    <div ref={rootRef} className="lux-shell text-white">
      <AnimatedBackdrop />
      <div className="ambient-grid" />
      <div className="ambient-noise" />
      <div
        className="ambient-orb ambient-orb-a"
        data-parallax="slow"
      />
      <div
        className="ambient-orb ambient-orb-b"
        data-parallax="fast"
      />

      <header
        className={`fixed left-0 right-0 top-0 z-50 mx-auto flex w-full max-w-full items-center justify-center px-6 py-4 transition-all duration-300 lg:px-10 ${
          isScrolled
            ? "border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
          <div className="max-w-[1400px] w-full flex justify-between">
              <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md">
                      <Wallet2 className="h-5 w-5 text-[#ffd4aa]" />
                  </div>
                  <div>
                      <div className="text-[11px] uppercase tracking-[0.34em] text-white/45">LI.FI Hackathon</div>
                      <div className="font-display text-xl tracking-[0.24em] text-white">EARNGIFT</div>
                  </div>
              </div>

              <div className="flex items-center gap-5">
                  <nav className="hidden items-center gap-7 text-[11px] uppercase tracking-[0.3em] text-white/55 lg:flex">
                      <a href="#why" className="transition hover:text-white">
                          Narrative
                      </a>
                      <a href="#flow" className="transition hover:text-white">
                          Flow
                      </a>
                      <a href="#proof" className="transition hover:text-white">
                          Proof
                      </a>
                      <a href="#faq" className="transition hover:text-white">
                          FAQ
                      </a>
                  </nav>
                  <div className="[&>div>button]:rounded-full [&>div>button]:border [&>div>button]:border-[#ffb476]/40 [&>div>button]:bg-gradient-to-br [&>div>button]:from-[#ffbe8a]/96 [&>div>button]:to-[#f28c57]/90 [&>div>button]:px-5 [&>div>button]:py-2.5 [&>div>button]:text-xs [&>div>button]:font-medium [&>div>button]:uppercase [&>div>button]:tracking-[0.2em] [&>div>button]:text-[#08111f] [&>div>button]:shadow-lg [&>div>button]:shadow-[#f28c57]/30 [&>div>button]:transition-all hover:[&>div>button]:scale-105">
                      <ConnectButton />
                  </div>
              </div>
          </div>

      </header>

      <div className="h-20" />

      <main className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-24 lg:px-10">
        <section
          data-story-section
          className="relative grid min-h-[92vh] items-center gap-16 overflow-hidden pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24"
        >
          <div className="space-y-8">
            <div data-reveal-chunk className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-4 py-2 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#ffb476] shadow-[0_0_16px_rgba(255,180,118,0.8)]" />
              <span className="text-[11px] uppercase tracking-[0.32em] text-white/65">
                Simple savings, powered by DeFi
              </span>
            </div>

            <div className="space-y-6">
              <RevealText
                as="p"
                dataReveal
                className="max-w-5xl font-display text-[clamp(3rem,11vw,6.7rem)] leading-[0.88] tracking-[-0.04em] text-white"
                text="Put idle USDC to work like a savings account."
              />
              <motion.p
                data-reveal-chunk
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl text-lg leading-8 text-white/68"
              >
                No APY jargon. No protocol hunting. No confusing multi-step flow. Pick how long you want to save, confirm the deposit, and watch your balance grow every second.
              </motion.p>
            </div>

            <motion.div
              data-reveal-chunk
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.9, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-4"
            >
              <a href="#flow" className="lux-button lux-button-primary">
                Start saving
              </a>
              <a href="#why" className="lux-button lux-button-secondary">
                How it works
              </a>
              <button type="button" onClick={() => setShowInviteCard(true)} className="lux-button lux-button-secondary">
                Share with friends
              </button>
            </motion.div>

            <div data-reveal-chunk className="grid gap-4 md:grid-cols-3">
              <MetricPanel label="For beginners" value="No DeFi terms" hint="Simple language from the first screen" />
              <MetricPanel label="Decision model" value="30 / 90 / 180 days" hint="Choose a duration, not a protocol" />
              <MetricPanel label="Core promise" value="Money grows live" hint="See earnings update after deposit" />
            </div>
          </div>

          <div data-reveal-chunk className="relative">
            <HeroVaultCard
              selectedDuration={selectedDuration}
              strategy={strategy}
              quotedReceive={quotedReceive}
              amount={numericAmount}
              onOpenInviteCard={() => setShowInviteCard(true)}
            />
          </div>
        </section>

        <section
          id="why"
          data-story-section
          className="relative grid gap-10 py-10 lg:grid-cols-[0.78fr_1.22fr] lg:py-24"
        >
          <div data-reveal-chunk className="sticky top-20 h-fit space-y-6 self-start">
            <SectionEyebrow>Why EarnGift</SectionEyebrow>
            <RevealText
              as="h2"
              dataReveal
              className="max-w-xl font-display text-[clamp(2.8rem,5vw,5rem)] leading-[0.95] tracking-[-0.04em]"
              text="DeFi yield should feel as simple as putting money into savings."
            />
            <p className="max-w-lg text-base leading-8 text-white/62">
              Most yield products talk to people who already understand DeFi. EarnGift talks to everyone else: simple time-based choices, one clear deposit flow, and visible growth after success.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {promiseBlocks.map((block, index) => (
              <motion.article
                key={block.index}
                data-reveal-chunk
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.9, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="glass-panel story-card group min-h-[320px] p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-[#ffd4aa]/82">{block.index}</span>
                  <ArrowUpRight className="h-4 w-4 text-white/45 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#ffd4aa]" />
                </div>
                <h3 className="mt-12 font-display text-3xl leading-tight text-white">{block.title}</h3>
                <p className="mt-5 text-sm leading-7 text-white/62">{block.body}</p>
                <div className="mt-10 h-px origin-left bg-gradient-to-r from-[#ffb476] via-white/55 to-transparent" data-progress-line />
              </motion.article>
            ))}
          </div>
        </section>

        <section data-story-section className="relative py-16 lg:py-24">
          <div className="glass-panel overflow-hidden p-8 lg:p-10">
            <div className="marquee-track">
              <div className="marquee-inner">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Fragment key={index}>
                    <span>One-click deposit</span>
                    <span>Auto-compound yield</span>
                    <span>No DeFi jargon</span>
                    <span>Real-time earnings</span>
                    <span>Multi-chain vaults</span>
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {flowMoments.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    data-reveal-chunk
                    initial={{ opacity: 0, y: 26 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-120px" }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[28px] border border-white/10 bg-black/16 p-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/6">
                      <Icon className="h-5 w-5 text-[#ffbf86]" />
                    </div>
                    <h3 className="mt-7 font-display text-3xl text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/62">{item.copy}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="flow"
          data-story-section
          className="grid gap-10 py-16 lg:grid-cols-[0.74fr_1.26fr] lg:gap-12 lg:py-24"
        >
          <div className="space-y-6">
            <SectionEyebrow>Five-step flow</SectionEyebrow>
            <RevealText
              as="h2"
              dataReveal
              className="max-w-xl font-display text-[clamp(2.8rem,5vw,4rem)] leading-[0.95] tracking-[-0.04em]"
              text="A five-step flow that hides complexity behind one simple decision."
            />
            <p className="max-w-lg text-base leading-8 text-white/62">
              First, the user chooses a duration. Then the system finds a strategy, prepares the quote, confirms the deposit, and turns the result into a live growth dashboard.
            </p>
            <div className="space-y-4">
              <FlowBullet number="01" title="Pick a duration" copy="Choose 30, 90, or 180 days. No protocol knowledge required." />
              <FlowBullet number="02" title="Review the route" copy="See the amount, estimated return, gas, and approval details before signing." />
              <FlowBullet number="03" title="See proof after deposit" copy="Track the transaction, load the portfolio, and share the result with friends." />
            </div>
          </div>

          <motion.div
            data-reveal-chunk
            initial={{ opacity: 0, y: 36, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel flow-panel rounded-[32px] p-6 sm:p-8"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-white/42">Interactive deposit flow</div>
                <h3 className="mt-3 font-display text-3xl text-white">Earn flow</h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-[#ffd4aa]">
                <span className="h-2 w-2 rounded-full bg-[#ffb476]" />
                {step === "success" ? "Portfolio live" : step === "depositing" ? "Transaction running" : "Ready"}
              </div>
            </div>

            {error ? <InlineMessage tone="warn">{error}</InlineMessage> : null}
            {statusMessage ? <InlineMessage tone="neutral">{statusMessage}</InlineMessage> : null}

            {(step === "idle" || step === "analyzing") && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <FlowHeader stepLabel="Step 01" title="How long do you want to save?" body="Choose a time horizon first. The product handles the strategy details for you." />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {strategyCards.map((card, index) => {
                    const active = selectedDuration === card.duration;

                    return (
                      <motion.button
                        key={card.duration}
                        type="button"
                        onClick={() => chooseDuration(card.duration)}
                        whileHover={{ y: -8, scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        transition={{ duration: 0.22 }}
                        className={`group rounded-[24px] border p-5 text-left transition ${
                          active
                            ? "border-[#ffb476]/60 bg-[#ffb476]/14 shadow-[0_20px_50px_rgba(255,180,118,0.18)]"
                            : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]"
                        }`}
                      >
                        <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">{card.subtitle}</div>
                        <div className="mt-6 font-display text-5xl text-white">{card.label}</div>
                        <div className="mt-8 flex items-center justify-between text-sm text-white/58">
                          <span>{card.protocolHint ? `${card.protocolHint} preferred` : "Best available APY"}</span>
                          <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-1 group-hover:translate-x-1" />
                        </div>
                        <div className="mt-4 h-px origin-left bg-gradient-to-r from-[#ffb476] via-white/60 to-transparent" data-progress-line />
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={step === "analyzing" || !strategy}
                    onClick={() => setStep("amount")}
                    className="lux-button lux-button-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next: Review strategy
                  </button>
                </div>

                <AnimatePresence>
                  {step === "analyzing" && (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.45 }}
                      className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                    >
                      <FlowHeader stepLabel="Step 02" title="Matching the best strategy" body="The system is comparing yield options for your chosen time horizon." />
                      <div className="mt-5 space-y-3">
                        {analysisMessages.map((message, index) => (
                          <motion.div
                            key={message}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.55, delay: index * 0.12 }}
                            className="flex items-center gap-3"
                          >
                            <span className="h-px w-12 animate-pulse-line bg-[#ffb476]/80" />
                            <span className="text-sm text-white/65">{message}</span>
                          </motion.div>
                        ))}
                      </div>
                      <p className="mt-5 text-sm text-white/46">{isLoading ? "Connecting to LI.FI Earn data..." : "Strategy ready."}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {step === "amount" && strategy && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <FlowHeader
                    stepLabel="Step 02"
                    title="Your strategy is ready"
                    body="Review the strategy, enter an amount, and confirm the deposit."
                    badge={strategy.source === "live" ? "Live data" : "Fallback"}
                  />
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("idle")}
                      className="lux-button lux-button-secondary text-xs px-3 py-2"
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DataTile label="Recommended strategy" value={strategy.vaultName} hint={`${strategy.protocolName} / ${strategy.chainName}`} />
                  <DataTile label="Expected APY" value={`${strategy.apy.toFixed(2)}%`} hint={strategy.pointsLabel ?? `Risk level: ${strategy.riskLabel}`} />
                  <DataTile
                    label={`Estimated return in ${strategy.duration} days`}
                    value={`$${strategy.estimatedReturnMin.toFixed(2)} - $${strategy.estimatedReturnMax.toFixed(2)}`}
                    hint="Estimated from the live APY"
                  />
                  <DataTile label="Deposit asset" value={strategy.inputToken} hint={`Chain ${strategy.chainId} / ${strategy.vaultAddress.slice(0, 8)}...`} />
                </div>

                <label className="block rounded-[28px] border border-white/10 bg-black/14 p-5">
                  <div className="text-[11px] uppercase tracking-[0.3em] text-white/42">Deposit amount</div>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
                    inputMode="decimal"
                    placeholder="500"
                    className="mt-4 w-full border-0 bg-transparent font-display text-6xl tracking-[-0.04em] text-white outline-none placeholder:text-white/18"
                  />
                  <div className="mt-4 text-sm text-white/46">The quote updates automatically when the amount changes.</div>
                </label>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <FlowHeader stepLabel="Step 03" title="Review before deposit" body="See the route details before you confirm the transaction." />
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <DataTile
                      label="You deposit"
                      value={`${numericAmount || 0} ${strategy.inputToken}`}
                      hint={isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect a wallet to generate a live quote"}
                    />
                    <DataTile
                      label="Estimated value at maturity"
                      value={projections ? `$${projections.projectedMin} - $${projections.projectedMax}` : "-"}
                      hint="Estimated from the current APY. Actual yield depends on the strategy."
                    />
                    <DataTile
                      label="Estimated gas"
                      value={
                        quote?.estimate.gasCosts?.[0]?.amountUSD
                          ? `$${Number(quote.estimate.gasCosts[0].amountUSD).toFixed(4)}`
                          : "-"
                      }
                      hint={quoteLoading ? "Loading quote" : "Final gas depends on the wallet confirmation"}
                    />
                    {/*<DataTile*/}
                    {/*  label="Estimated receive"*/}
                    {/*  value={quotedReceive ? `${quotedReceive.best}` : "-"}*/}
                    {/*  hint={quotedReceive ? `Minimum ${quotedReceive.minimum}` : "Waiting for live quote"}*/}
                    {/*/>*/}
                  </div>
                  {quoteError ? <p className="mt-5 text-sm text-[#ffb476]">{quoteError}</p> : null}
                  <button
                    type="button"
                    onClick={beginDeposit}
                    disabled={!numericAmount || !isConnected || !quote || quoteLoading}
                    className="lux-button lux-button-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isConnected ? "Confirm and deposit" : "Connect wallet first"}
                  </button>
                </div>
              </div>
            )}

            {step === "depositing" && strategy && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <FlowHeader stepLabel="Step 04" title="Your deposit is in progress" body="Track approval and deposit in real time." />
                  <button
                    type="button"
                    disabled
                    className="lux-button lux-button-secondary text-xs px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Processing...
                  </button>
                </div>
                <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                  <ProgressRow
                    title="Step 1: Approve funds"
                    state={approvalState === "complete" ? "complete" : approvalState === "active" ? "active" : "pending"}
                    hash={approvalHash}
                    scanUrl={approvalHash && strategy ? getExplorerUrl(strategy.chainId, approvalHash) : undefined}
                  />
                  <ProgressRow
                    title="Step 2: Deposit into the vault"
                    state={depositState === "complete" ? "complete" : depositState === "active" ? "active" : "pending"}
                    hash={depositHash}
                    scanUrl={depositHash && strategy ? getExplorerUrl(strategy.chainId, depositHash) : undefined}
                  />
                </div>
              </div>
            )}

            {step === "success" && strategy && position && depositedAt && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <FlowHeader
                    stepLabel="Step 04"
                    title="Your money is now working"
                    body={`Your ${numericAmount} ${strategy.inputToken} is now earning. Track growth, verify the position, and share it.`}
                  />
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("idle");
                        setAmount("");
                        setStrategy(null);
                        setSelectedDuration(null);
                        setQuote(null);
                        setError(null);
                      }}
                      className="lux-button lux-button-secondary text-xs px-3 py-2"
                    >
                      Start over
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <DataTile label="Earned today" value={`$${position.earned.toFixed(6)}`} hint="Refreshes every 3 seconds" large />
                  <DataTile label="Yearly yield" value={`$${position.yearlyYield.toFixed(2)} / year`} hint={`${strategy.apy.toFixed(2)}% APY`} />
                  <DataTile label="Deposit time" value={new Date(depositedAt).toLocaleString("en-US")} hint="Yield starts after the on-chain confirmation" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DataTile
                    label="Approval transaction"
                    value={approvalHash ? `${approvalHash.slice(0, 10)}...` : "Skipped"}
                    hint={approvalHash ? "Open the scan link below" : "Approval can be skipped if allowance is already sufficient"}
                  />
                  <DataTile
                    label="Deposit transaction"
                    value={depositHash ? `${depositHash.slice(0, 10)}...` : "-"}
                    hint={depositHash ? "Confirmed on-chain and ready to verify" : "Waiting for transaction hash"}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  {approvalHash && strategy ? (
                    <a
                      href={getExplorerUrl(strategy.chainId, approvalHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="lux-button lux-button-secondary"
                    >
                      View approval scan
                    </a>
                  ) : null}
                  {depositHash && strategy ? (
                    <a
                      href={getExplorerUrl(strategy.chainId, depositHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="lux-button lux-button-secondary"
                    >
                      View deposit scan
                    </a>
                  ) : null}
                  <button type="button" onClick={() => refreshPortfolio()} className="lux-button lux-button-secondary">
                    {portfolioLoading ? "Loading..." : "Verify portfolio"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </section>

        <section
          id="proof"
          data-story-section
          className="grid gap-8 py-16 lg:grid-cols-[1fr_1fr] lg:py-24"
        >
          <div className="space-y-6">
            <SectionEyebrow>Proof</SectionEyebrow>
            <RevealText
              as="h2"
              dataReveal
              className="max-w-xl font-display text-[clamp(2.8rem,5vw,5rem)] leading-[0.95] tracking-[-0.04em]"
              text="After deposit, users should be able to verify that everything worked."
            />
            <p className="max-w-lg text-base leading-8 text-white/62">
              The success state should not stop at a confirmation message. It should show transaction proof, portfolio visibility, and a shareable result.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="glass-panel rounded-[28px] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.3em] text-white/42">Verification</div>
                  <h3 className="mt-3 font-display text-3xl text-white">LI.FI Earn Portfolio</h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-[#ffd4aa]">
                  {portfolioPositions.length} positions
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/58">
                {portfolioMessage ?? "Load the LI.FI Earn portfolio here after a successful deposit."}
              </p>
              <div className="mt-5 space-y-3">
                {portfolioPositions.length ? (
                  portfolioPositions.map((item, index) => (
                    <div key={`${item.chainId}-${item.vaultAddress}-${index}`} className="rounded-[22px] border border-white/10 bg-black/14 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-display text-2xl text-white">{item.vaultName}</div>
                          <div className="mt-2 text-sm text-white/48">{item.chainId}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-2xl text-white">{item.amountUsd}</div>
                          <div className="mt-2 text-sm text-white/48">{item.symbol}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-white/12 p-4 text-sm text-white/48">
                    No position returned yet. New deposits sometimes need a little time to index.
                  </div>
                )}
              </div>
              {address ? (
                <pre className="mt-5 overflow-x-auto rounded-[22px] border border-white/10 bg-black/18 p-4 text-xs text-white/62">
{`curl -X GET 'https://earn.li.fi/v1/earn/portfolio/${address}/positions'`}
                </pre>
              ) : null}
            </div>

            <InviteShareCard ref={shareCardRef} strategy={strategy} amount={numericAmount} className="glass-panel rounded-[28px] p-6" showUrl={true}>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={openShareModal} className="lux-button lux-button-secondary">
                  Generate share card
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `${strategy ? createShareText(numericAmount, strategy) : "I am trying EarnGift on LI.FI Earn"} Try it here -> ${currentUrl}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="lux-button lux-button-secondary"
                >
                  Share on X
                </a>
              </div>
              {shareMessage ? <p className="mt-4 text-sm text-white/52">{shareMessage}</p> : null}
            </InviteShareCard>
          </div>
        </section>

        <section id="faq" data-story-section className="py-16 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="space-y-6">
              <SectionEyebrow>FAQ</SectionEyebrow>
              <RevealText
                as="h2"
                dataReveal
                className="max-w-xl font-display text-[clamp(2.8rem,5vw,5rem)] leading-[0.95] tracking-[-0.04em]"
                text="Clear answers for first-time users."
              />
            </div>

            <div className="glass-panel rounded-[32px] p-4 sm:p-6">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={item.question} className="border-b border-white/10 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-6 py-5 text-left"
                    >
                      <span className="font-display text-2xl text-white">{item.question}</span>
                      <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.32 }}>
                        <ChevronDown className="h-5 w-5 text-[#ffd4aa]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="pb-5 pr-10 text-sm leading-7 text-white/62">{item.answer}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <AnimatePresence>
        {showInviteCard ? (
          <InviteCardModal
            strategy={strategy}
            amount={numericAmount}
            onClose={() => setShowInviteCard(false)}
            onDownload={downloadShareCard}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 8], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 2, 5]} intensity={1.3} color="#ffd7ad" />
        <pointLight position={[-4, -3, 2]} intensity={1.1} color="#9ad7ff" />
        <Sparkles count={70} scale={[12, 16, 8]} size={2} speed={0.18} color="#ffd4aa" opacity={0.6} />
        <BackdropMeshes />
      </Canvas>
    </div>
  );
}

function BackdropMeshes() {
  const groupRef = useRef<THREE.Group>(null);
  const btcRef = useRef<THREE.Mesh>(null);
  const ethRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y += delta * 0.08;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.14) * 0.12;

    if (btcRef.current) {
      btcRef.current.rotation.y += delta * 0.3;
    }
    if (ethRef.current) {
      ethRef.current.rotation.y += delta * 0.25;
      ethRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.4} rotationIntensity={0.65} floatIntensity={0.7}>
        <group position={[-2.5, 1.8, -1]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh ref={btcRef}>
            <cylinderGeometry args={[1.2, 1.2, 0.15, 64]} />
            <meshStandardMaterial color="#c9956a" transparent opacity={0.5} metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh ref={btcRef} position={[0, 0.08, 0]}>
            <cylinderGeometry args={[1.0, 1.0, 0.02, 64]} />
            <meshStandardMaterial color="#b88a5e" transparent opacity={0.35} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh ref={btcRef} position={[0, -0.08, 0]}>
            <cylinderGeometry args={[1.0, 1.0, 0.02, 64]} />
            <meshStandardMaterial color="#b88a5e" transparent opacity={0.35} metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      </Float>
      <Float speed={1.2} rotationIntensity={1} floatIntensity={1.1}>
        <mesh ref={ethRef} position={[2.4, -0.6, -0.5]} scale={[0.7, 1.3, 0.7]}>
          <octahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial color="#8ccfff" transparent opacity={0.45} metalness={0.5} roughness={0.25} />
        </mesh>
      </Float>
      <Float speed={1.7} rotationIntensity={0.8} floatIntensity={0.9}>
        <mesh position={[0.8, 2.4, -2.2]}>
          <sphereGeometry args={[0.72, 48, 48]} />
          <meshStandardMaterial color="#4a90d9" transparent opacity={0.35} metalness={0.4} roughness={0.6} />
        </mesh>
      </Float>
    </group>
  );
}

function SectionEyebrow({ children }: { children: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-4 py-2 backdrop-blur-md">
      <span className="h-2 w-2 rounded-full bg-[#ffb476]" />
      <span className="text-[11px] uppercase tracking-[0.32em] text-white/58">{children}</span>
    </div>
  );
}

function RevealText({
  text,
  className,
  as = "h2"
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p";
  dataReveal?: boolean;
}) {
  const Tag = as;
  const hasSpaces = /\s/.test(text);
  const segments = hasSpaces ? text.split(/(\s+)/) : Array.from(text);

  return (
    <Tag className={className} data-reveal-chunk>
      {segments.map((segment, index) => (
        /^\s+$/.test(segment) ? (
          <span key={`space-${index}`} className="whitespace-pre-wrap">
            {segment}
          </span>
        ) : (
          <motion.span
            key={`${segment}-${index}`}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.8, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className={hasSpaces ? "inline-block whitespace-nowrap" : "inline-block"}
          >
            {segment}
          </motion.span>
        )
      ))}
    </Tag>
  );
}

function HeroVaultCard({
  selectedDuration,
  strategy,
  quotedReceive,
  amount,
  onOpenInviteCard
}: {
  selectedDuration: DurationOption | null;
  strategy: StrategyResult | null;
  quotedReceive: { best: string; minimum: string } | null;
  amount: number;
  onOpenInviteCard: () => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 24, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
        className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ffb476]/20"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 34, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
        className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
      />
      <div className="hero-card relative overflow-hidden rounded-[36px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-[24px] sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">Vault preview</div>
            <div className="mt-3 font-display text-3xl text-white">Simple yield preview</div>
          </div>
          <div className="rounded-full border border-white/12 bg-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-[#ffd4aa]">
            {selectedDuration ? `${selectedDuration}d selected` : "Choose a duration"}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <PreviewTile label="Route state" value={strategy ? strategy.protocolName : "Discover"} hint={strategy ? strategy.chainName : "Waiting for a duration"} />
          {/*<PreviewTile*/}
          {/*  label="Projected receive"*/}
          {/*  value={quotedReceive ? quotedReceive.best : "--"}*/}
          {/*  hint={quotedReceive ? `minimum ${quotedReceive.minimum}` : "Share anytime"}*/}
          {/*  hintAction={{*/}
          {/*    label: "Open card",*/}
          {/*    onClick: onOpenInviteCard*/}
          {/*  }}*/}
          {/*/>*/}
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-black/20 p-6">
          <motion.div
            animate={{ x: ["-10%", "105%"] }}
            transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/18 to-transparent blur-2xl"
          />
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">Live readout</div>
          <div className="mt-4 font-display text-[clamp(3.4rem,7vw,5.6rem)] leading-none tracking-[-0.05em] text-white">
            ${amount || 500}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-white/54">
            <span>{strategy ? `${strategy.apy.toFixed(2)}% APY` : "Waiting for live strategy"}</span>
            <span>{strategy ? strategy.vaultName : "Yield vault"}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <MiniStat label="Chains" value="60+" />
          <MiniStat label="Protocols" value="20+" />
          <MiniStat label="Deposit speed" value="30 sec" />
        </div>
      </div>
    </div>
  );
}

function MetricPanel({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.22 }}
      className="glass-panel rounded-[26px] p-5"
    >
      <div className="text-[11px] uppercase tracking-[0.28em] text-white/42">{label}</div>
      <div className="mt-6 font-display text-3xl leading-tight text-white">{value}</div>
      <div className="mt-4 text-sm leading-6 text-white/52">{hint}</div>
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="text-[10px] uppercase tracking-[0.28em] text-white/38">{label}</div>
      <div className="mt-3 font-display text-2xl text-white">{value}</div>
    </div>
  );
}

function PreviewTile({
  label,
  value,
  hint,
  hintAction
}: {
  label: string;
  value: string;
  hint: string;
  hintAction?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/12 p-5">
      <div className="text-[10px] uppercase tracking-[0.28em] text-white/38">{label}</div>
      <div className="mt-4 font-display text-3xl text-white">{value}</div>
      <div className="mt-3 flex items-center justify-between gap-4 text-sm text-white/50">
        <span>{hint}</span>
        {hintAction ? (
          <button
            type="button"
            onClick={hintAction.onClick}
            className="shrink-0 text-[11px] uppercase tracking-[0.24em] text-[#ffd4aa] transition hover:text-white"
          >
            {hintAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

const InviteShareCard = forwardRef<HTMLDivElement, {
  strategy: StrategyResult | null;
  amount: number;
  className?: string;
  children?: React.ReactNode;
  cardTitle?: string;
  cardBody?: string;
  showUrl?: boolean;
}>(function InviteShareCard({
  strategy,
  amount,
  className,
  children,
  cardTitle,
  cardBody,
  showUrl
}, ref) {
  return (
    <div ref={ref} className={`${className} relative overflow-hidden`}>
      {/* Decorative gradient orb */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#ffb476]/10 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#ff6b6b]/5 blur-3xl" />

      <div className="relative">
        {/* Header badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ffb476]/30 bg-[#ffb476]/10">
            <svg className="h-4 w-4 text-[#ffb476]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#ffd4aa]/82">Share Card</div>
        </div>

        {/* Main content */}
        <h3 className="mt-6 max-w-lg font-display text-4xl leading-[1.1] tracking-[-0.02em] text-white">
          {cardTitle ?? (strategy ? `I deposited ${amount || 0} ${strategy.inputToken} into a yield vault` : "Turn saving into something worth sharing")}
        </h3>

        <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
          {cardBody ?? (strategy
            ? `${strategy.apy.toFixed(2)}% APY, with earnings growing every day.`
            : "Generate a shareable card after a successful deposit and invite friends to try it.")}
        </p>

        {/* Stats row for strategy */}
        {strategy && (
          <div className="mt-6 flex items-center gap-6 border-y border-white/10 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/40">Amount</div>
              <div className="mt-1 font-display text-2xl text-white">{amount || 0} {strategy.inputToken}</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/40">APY</div>
              <div className="mt-1 font-display text-2xl text-[#ffb476]">{strategy.apy.toFixed(2)}%</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/40">Duration</div>
              <div className="mt-1 font-display text-2xl text-white">{strategy.duration}d</div>
            </div>
          </div>
        )}

        {/* URL display */}
        {showUrl && (
          <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
            <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-sm text-white/60">earngift.li.fi</span>
          </div>
        )}

        {children}
      </div>
    </div>
  );
});

function InviteCardModal({
  strategy,
  amount,
  onClose,
  onDownload
}: {
  strategy: StrategyResult | null;
  amount: number;
  onClose: () => void;
  onDownload?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060d]/90 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <InviteShareCard
          strategy={strategy}
          amount={amount}
          className="glass-panel rounded-[32px] p-6 sm:p-8"
          cardTitle="Invite a friend to start earning with EarnGift"
          cardBody="Put idle USDC to work in one clear flow. Pick a duration, confirm the deposit, and watch earnings grow in real time."
          showUrl={true}
        >
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onDownload}
              className="lux-button lux-button-primary flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download card
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                strategy ? `I deposited ${amount || 0} ${strategy.inputToken} at ${strategy.apy.toFixed(2)}% APY on EarnGift! Try it here -> earngift.li.fi` : "Check out EarnGift - simple DeFi yield"
              )}`}
              target="_blank"
              rel="noreferrer"
              className="lux-button lux-button-secondary flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
            <button type="button" onClick={onClose} className="lux-button lux-button-secondary ml-auto">
              Close
            </button>
          </div>
        </InviteShareCard>
      </motion.div>
    </motion.div>
  );
}

function FlowHeader({
  stepLabel,
  title,
  body,
  badge
}: {
  stepLabel: string;
  title: string;
  body: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.3em] text-white/42">{stepLabel}</div>
        <h4 className="mt-3 font-display text-3xl text-white">{title}</h4>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">{body}</p>
      </div>
      {badge ? (
        <div className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-[#ffd4aa]">
          {badge}
        </div>
      ) : null}
    </div>
  );
}

function InlineMessage({
  tone,
  children
}: {
  tone: "warn" | "neutral";
  children: string;
}) {
  return (
    <div
      className={`mb-5 rounded-[20px] border px-4 py-3 text-sm ${
        tone === "warn"
          ? "border-[#ffb476]/30 bg-[#ffb476]/10 text-[#ffd7b2]"
          : "border-white/10 bg-white/[0.05] text-white/70"
      }`}
    >
      {children}
    </div>
  );
}

function FlowBullet({
  number,
  title,
  copy
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[#ffd4aa]/82">{number}</div>
      <div className="mt-4 font-display text-2xl text-white">{title}</div>
      <p className="mt-3 text-sm leading-7 text-white/56">{copy}</p>
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
    <div className="rounded-[24px] border border-white/10 bg-black/14 p-5">
      <div className="text-[11px] uppercase tracking-[0.28em] text-white/42">{label}</div>
      <div className={`mt-4 break-words font-display tracking-[-0.03em] text-white ${large ? "text-5xl" : "text-3xl"}`}>
        {value}
      </div>
      <div className="mt-4 text-sm leading-6 text-white/52">{hint}</div>
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
  const text = state === "complete" ? "Complete" : state === "active" ? "Processing..." : "Pending";

  return (
    <div className="rounded-[22px] border border-white/10 bg-black/12 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
              state === "complete"
                ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-200"
                : state === "active"
                  ? "border-[#ffb476]/50 bg-[#ffb476]/12 text-[#ffd4aa]"
                  : "border-white/10 bg-white/[0.04] text-white/38"
            }`}
          >
            {state === "complete" ? "✓" : state === "active" ? "⟳" : "·"}
          </span>
          <span className="text-base text-white">{title}</span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/42">{text}</span>
      </div>
      <div className="mt-4 h-px origin-left bg-gradient-to-r from-[#ffb476] via-white/60 to-transparent" data-progress-line />
      {hash ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/48">
          <span className="font-mono">{hash}</span>
          {scanUrl ? (
            <a href={scanUrl} target="_blank" rel="noreferrer" className="text-[#ffd4aa] underline-offset-4 hover:underline">
              Open scan
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
