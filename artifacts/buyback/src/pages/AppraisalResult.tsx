import { useState, useMemo } from "react";
import { useSearch, Link } from "wouter";
import LZString from "lz-string";
import { motion } from "framer-motion";
import { useGetBuybackRates } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { formatIsk } from "@/lib/utils";
import { ArrowLeft, Copy, CheckCircle2, TrendingDown, TrendingUp, DollarSign, Database, Server, ArrowRight } from "lucide-react";
import type { AppraisalResult } from "@workspace/api-client-react";

export default function AppraisalResultPage() {
  const searchString = useSearch();
  const [copied, setCopied] = useState(false);

  // Decode and parse the URL parameter data memoized
  const parsedData = useMemo(() => {
    try {
      const params = new URLSearchParams(searchString);
      const dataParam = params.get("data");
      if (!dataParam) return null;
      return JSON.parse(LZString.decompressFromEncodedURIComponent(dataParam)) as AppraisalResult;
    } catch (e) {
      console.error("Failed to parse appraisal data", e);
      return null;
    }
  }, [searchString]);

  // Fetch the current buyback rates config for the sidebar
  const { data: ratesData } = useGetBuybackRates();

  if (!parsedData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/30">
            <Server className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-3xl font-display font-bold text-destructive mb-4 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">Corrupt Data Stream</h2>
          <p className="text-muted-foreground font-mono max-w-md mx-auto mb-8">
            The appraisal payload could not be decoded. The transmission may have been interrupted or the link is invalid.
          </p>
          <Link 
            href="/" 
            className="px-6 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary-border rounded-lg transition-colors font-mono uppercase tracking-widest text-sm inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Input
          </Link>
        </div>
      </Layout>
    );
  }

  const handleCopy = () => {
    const lines = [
      `[Nisuwa Cartel Buyback Quote]`,
      `Total Market Value:  ${formatIsk(parsedData.totalValue)}`,
      `Total Buyback Value: ${formatIsk(parsedData.totalBuybackValue)}`,
      `Profit Margin:       ${formatIsk(parsedData.totalValue - parsedData.totalBuybackValue)}`,
      ``,
      `--- Itemized Breakdown ---`
    ];
    
    parsedData.items.forEach(item => {
      lines.push(`${item.quantity.toLocaleString()}x ${item.typeName} @ ${formatIsk(item.buybackPrice)} (Rate: ${item.buybackRate * 100}%)`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const profitISK = parsedData.totalValue - parsedData.totalBuybackValue;
  const effectiveRate = parsedData.totalValue > 0 ? (parsedData.totalBuybackValue / parsedData.totalValue) * 100 : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  } as const;

  return (
    <Layout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">

        {/* Header Actions */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-mono text-sm uppercase tracking-widest px-4 py-2 border border-border/50 rounded-lg bg-card/30 hover:bg-card/80 backdrop-blur">
            <ArrowLeft className="w-4 h-4" />
            New Appraisal
          </Link>
          <div className="text-xs font-mono text-muted-foreground border border-border/50 px-4 py-2 rounded-lg bg-card/30 backdrop-blur flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-primary" />
            Data Timestamp: {new Date(parsedData.timestamp).toLocaleString()}
          </div>
        </motion.div>

        {/* Top Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 relative overflow-hidden group hover:border-border transition-colors">
            <div className="text-muted-foreground font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Jita Sell Value
            </div>
            <div className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white/90">
              {formatIsk(parsedData.totalValue)}
            </div>
          </div>

          <div className="bg-primary/10 backdrop-blur-md border border-primary/30 rounded-2xl p-6 relative overflow-hidden group shadow-[0_0_30px_rgba(218,165,32,0.05)]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
            <div className="relative">
              <div className="text-primary font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Total Buyback Value
              </div>
              <div className="text-3xl md:text-4xl font-bold font-display tracking-tight text-white drop-shadow-[0_0_10px_rgba(218,165,32,0.6)]">
                {formatIsk(parsedData.totalBuybackValue)}
              </div>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 relative overflow-hidden">
            <div className="text-muted-foreground font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-accent" /> Effective Rate
            </div>
            <div className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white/90">
              {effectiveRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground/70 mt-2 font-mono flex justify-between items-center">
              <span>Cartel Margin:</span>
              <span className="text-accent">{formatIsk(profitISK)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-center">
          <Link
            href={`/buyback?${searchString}`}
            className="group relative px-10 py-4 font-display font-bold uppercase tracking-widest text-sm bg-primary/10 text-primary border border-primary/40 rounded-xl hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] transition-all duration-300 overflow-hidden inline-flex items-center gap-3"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              Proceed to Buyback Contract
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Table */}
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold uppercase tracking-wider text-white/90">Itemized Breakdown</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 bg-secondary/80 hover:bg-secondary text-secondary-foreground border border-secondary-border rounded-xl text-sm font-mono transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Data Copied" : "Copy Summary"}
              </button>
            </div>

            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground/80 font-mono uppercase bg-black/60 border-b border-border/60">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Asset ID / Classification</th>
                      <th className="px-6 py-4 font-semibold text-right">Units</th>
                      <th className="px-6 py-4 font-semibold text-right">Unit Price (Jita)</th>
                      <th className="px-6 py-4 font-semibold text-center">Appraisal %</th>
                      <th className="px-6 py-4 font-semibold text-right text-primary">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 font-mono">
                    {parsedData.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground/90 tracking-wide group-hover:text-primary transition-colors">{item.typeName}</div>
                          <div className="text-[10px] text-muted-foreground/60 mt-1 uppercase">{item.marketGroupName}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground/90 font-medium">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          {formatIsk(item.pricePerUnit)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-black/50 text-xs text-muted-foreground border border-border/30">
                            {(item.buybackRate * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-primary drop-shadow-[0_0_5px_rgba(218,165,32,0.3)]">
                          {formatIsk(item.buybackPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Sidebar Rates Configuration */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xl font-display font-bold uppercase tracking-wider text-white/90">Current Rates</h3>
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full filter blur-xl" />
              
              {ratesData ? (
                <div className="space-y-4 font-mono text-sm relative z-10">
                  <div className="flex justify-between items-center pb-3 border-b border-border/60">
                    <span className="text-muted-foreground/80 uppercase text-xs tracking-widest">Base Rate</span>
                    <span className="font-bold text-white/90">{(ratesData.defaultRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="space-y-3 pt-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Specific Classifications</div>
                    {ratesData.rates.map((rate, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{rate.groupName}</span>
                        <span className="font-bold text-primary">{(rate.rate * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-4 relative z-10">
                  {[1,2,3,4,5].map(i => (
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
