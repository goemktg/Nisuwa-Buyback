import { useState, useMemo } from "react";
import { useSearch, useLocation } from "wouter";
import LZString from "lz-string";
import { motion } from "framer-motion";
import { useAppraiseItems } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { formatIsk } from "@/lib/utils";
import { FileText, Cpu, ArrowRight, AlertCircle, Link2, CheckCircle2, DollarSign, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getRateReason } from "@/lib/rate-reason";
import type { AppraisalResult } from "@workspace/api-client-react";

function BuybackInput() {
  const [itemsText, setItemsText] = useState("");
  const [, setLocation] = useLocation();
  const appraise = useAppraiseItems();

  const handleSubmit = () => {
    if (!itemsText.trim()) return;
    appraise.mutate(
      { data: { items: itemsText } },
      {
        onSuccess: (data) => {
          const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
          setLocation(`/buyback?data=${compressed}`);
        },
      }
    );
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight drop-shadow-lg uppercase text-white">
            Contract <span className="text-primary drop-shadow-[0_0_15px_rgba(218,165,32,0.5)]">Buyback</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-mono">
            아래에 아이템 목록을 붙여넣으면 바이백 견적을 확인할 수 있습니다.
          </p>
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-1 shadow-2xl shadow-black/80 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-70" />

          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary font-mono text-sm uppercase tracking-widest">
                <FileText className="w-4 h-4" />
                <span>아이템 목록을 붙여넣으세요</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Format: [Item Name] [Quantity]
              </div>
            </div>

            <textarea
              className="w-full h-72 bg-background/80 border border-border/50 rounded-xl p-5 text-foreground font-mono text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all resize-none shadow-inner custom-scrollbar"
              placeholder={`Tritanium\t100000\nPyerite\t50000\nOmen\t5\n\n// Copy from EVE Online Inventory (Ctrl+C) and paste here (Ctrl+V)`}
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              disabled={appraise.isPending}
            />

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-mono text-muted-foreground/70 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Prices from Jita 4-4
              </div>

              <button
                onClick={handleSubmit}
                disabled={appraise.isPending || !itemsText.trim()}
                className="w-full sm:w-auto group relative px-8 py-4 font-display font-bold uppercase tracking-widest text-sm bg-primary/10 text-primary border border-primary/40 rounded-xl hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {appraise.isPending ? (
                    <>
                      <Cpu className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Get Buyback Quote
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>

            {appraise.isError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive font-mono text-sm flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold uppercase tracking-wider mb-1">Error</div>
                  <div className="opacity-90">{appraise.error?.message || "Something went wrong. Please try again."}</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}

function BuybackResult({ parsedData, searchString }: { parsedData: AppraisalResult; searchString: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/buyback?${searchString}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  } as const;

  return (
    <Layout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight uppercase text-white">
            Contract <span className="text-primary drop-shadow-[0_0_15px_rgba(218,165,32,0.5)]">Buyback</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-xl mx-auto">
            아래 바이백 금액으로 인게임 컨트랙트를 생성해 주세요.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-primary/10 backdrop-blur-md border border-primary/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_40px_rgba(218,165,32,0.08)]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-primary font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Contract Value
              </div>
              <div className="text-4xl md:text-5xl font-bold font-display tracking-tight text-white drop-shadow-[0_0_15px_rgba(218,165,32,0.6)]">
                {formatIsk(parsedData.totalBuybackValue)}
              </div>
              <div className="text-xs text-muted-foreground/70 mt-2 font-mono">
                {parsedData.items.length} item type{parsedData.items.length !== 1 ? "s" : ""} &middot; {parsedData.items.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()} total units
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="group px-8 py-4 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/40 rounded-xl font-display font-bold uppercase tracking-widest text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  Copy Contract Link
                </>
              )}
            </button>
          </div>
        </motion.div>

        <div>
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xl font-display font-bold uppercase tracking-wider text-white/90 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Items & Buyback Prices
            </h3>
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground/80 font-mono uppercase bg-black/60 border-b border-border/60">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Item</th>
                      <th className="px-6 py-4 font-semibold text-right">Qty</th>
                      <th className="px-6 py-4 font-semibold text-right">Jita Price</th>
                      <th className="px-6 py-4 font-semibold text-center">Rate</th>
                      <th className="px-6 py-4 font-semibold text-right">Buyback / Unit</th>
                      <th className="px-6 py-4 font-semibold text-right text-primary">Buyback Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 font-mono">
                    {parsedData.items.map((item, idx) => {
                      const buybackPerUnit = item.pricePerUnit * item.buybackRate;
                      return (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-foreground/90 tracking-wide group-hover:text-primary transition-colors">
                              {item.typeName}
                            </div>
                            <div className="text-[10px] text-muted-foreground/60 mt-1 uppercase">
                              {item.marketGroupName}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-foreground/90 font-medium">
                            {item.quantity.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-muted-foreground">
                            {formatIsk(item.pricePerUnit)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-xs text-primary border border-primary/20 cursor-help">
                                  {(item.buybackRate * 100).toFixed(0)}%
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{getRateReason(item.marketGroupName, item.buybackRate)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="px-6 py-4 text-right text-muted-foreground">
                            {formatIsk(buybackPerUnit)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-primary drop-shadow-[0_0_5px_rgba(218,165,32,0.3)]">
                            {formatIsk(item.buybackPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-black/40 border-t border-primary/30">
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-right font-display font-bold uppercase tracking-wider text-white/80">
                        Total Buyback
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-lg text-primary drop-shadow-[0_0_8px_rgba(218,165,32,0.5)]">
                        {formatIsk(parsedData.totalBuybackValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}

export default function BuybackPage() {
  const searchString = useSearch();

  const parsedData = useMemo(() => {
    try {
      const params = new URLSearchParams(searchString);
      const dataParam = params.get("data");
      if (!dataParam) return null;
      return JSON.parse(LZString.decompressFromEncodedURIComponent(dataParam)) as AppraisalResult;
    } catch {
      return null;
    }
  }, [searchString]);

  if (!parsedData) {
    return <BuybackInput />;
  }

  return <BuybackResult parsedData={parsedData} searchString={searchString} />;
}
