import { useState, useMemo } from "react";
import { useSearch, Link } from "wouter";
import LZString from "lz-string";
import { motion } from "framer-motion";
import { useGetBuybackRates } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { formatIsk } from "@/lib/utils";
import { ArrowLeft, Copy, CheckCircle2, DollarSign, ShieldCheck, Package } from "lucide-react";
import type { AppraisalResult } from "@workspace/api-client-react";

export default function BuybackPage() {
  const searchString = useSearch();
  const [copied, setCopied] = useState(false);

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

  const { data: ratesData } = useGetBuybackRates();

  if (!parsedData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/30">
            <Package className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-3xl font-display font-bold text-destructive mb-4 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">No Buyback Data</h2>
          <p className="text-muted-foreground font-mono max-w-md mx-auto mb-8">
            Please appraise your items first, then access the buyback page from the appraisal results.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary-border rounded-lg transition-colors font-mono uppercase tracking-widest text-sm inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Start Appraisal
          </Link>
        </div>
      </Layout>
    );
  }

  const handleCopyBuyback = () => {
    const lines = [
      `[Nisuwa Cartel Buyback Contract]`,
      `Total Buyback Value: ${formatIsk(parsedData.totalBuybackValue)}`,
      ``,
      `--- Items to Contract ---`,
    ];

    parsedData.items.forEach((item) => {
      lines.push(
        `${item.quantity.toLocaleString()}x ${item.typeName} — ${formatIsk(item.buybackPrice)} (${(item.buybackRate * 100).toFixed(0)}%)`,
      );
    });

    lines.push(``);
    lines.push(`Contract this to Nisuwa Cartel Buyback for ${formatIsk(parsedData.totalBuybackValue)}`);

    navigator.clipboard.writeText(lines.join("\n"));
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
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/appraisal?${searchString}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-mono text-sm uppercase tracking-widest px-4 py-2 border border-border/50 rounded-lg bg-card/30 hover:bg-card/80 backdrop-blur"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Appraisal
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight uppercase text-white">
            <span className="text-primary drop-shadow-[0_0_15px_rgba(218,165,32,0.5)]">Buyback</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-xl mx-auto">
            Create an in-game contract with the items below for the listed buyback value.
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
              onClick={handleCopyBuyback}
              className="group px-8 py-4 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/40 rounded-xl font-display font-bold uppercase tracking-widest text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Contract Info
                </>
              )}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-4">
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
                            <span className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-xs text-primary border border-primary/20">
                              {(item.buybackRate * 100).toFixed(0)}%
                            </span>
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

          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xl font-display font-bold uppercase tracking-wider text-white/90">Rate Schedule</h3>
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full filter blur-xl" />
              {ratesData ? (
                <div className="space-y-4 font-mono text-sm relative z-10">
                  <div className="flex justify-between items-center pb-3 border-b border-border/60">
                    <span className="text-muted-foreground/80 uppercase text-xs tracking-widest">Default</span>
                    <span className="font-bold text-white/90">{(ratesData.defaultRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="space-y-3 pt-1">
                    {ratesData.rates.map((rate, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs">{rate.groupName}</span>
                        <span className="font-bold text-primary text-xs">{(rate.rate * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-4 relative z-10">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-3 bg-white/5 rounded w-1/2"></div>
                      <div className="h-3 bg-primary/10 rounded w-8"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}
