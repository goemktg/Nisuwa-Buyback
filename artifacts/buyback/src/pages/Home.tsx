import { useState } from "react";
import { useLocation } from "wouter";
import { useAppraiseItems } from "@workspace/api-client-react";
import LZString from "lz-string";
import { motion } from "framer-motion";
import { FileText, Cpu, ArrowRight, AlertCircle } from "lucide-react";
import { Layout } from "@/components/Layout";

export default function Home() {
  const [itemsText, setItemsText] = useState("");
  const [, setLocation] = useLocation();
  const appraise = useAppraiseItems();

  const handleSubmit = () => {
    if (!itemsText.trim()) return;

    appraise.mutate(
      { data: { items: itemsText } },
      {
        onSuccess: (data) => {
          // Compress the resulting data so it safely fits in the URL
          const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
          setLocation(`/appraisal?data=${compressed}`);
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
            <span className="text-primary drop-shadow-[0_0_15px_rgba(218,165,32,0.5)]">Appraisal</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-mono">
            아래에 아이템을 붙여넣으면 Jita 시세와 바이백 견적을 확인할 수 있습니다.
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
                      Appraise Items
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>

            {appraise.isError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
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
