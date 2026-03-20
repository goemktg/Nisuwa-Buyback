import { Layout } from "@/components/Layout";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-8xl font-display font-bold text-primary mb-2 drop-shadow-[0_0_20px_rgba(218,165,32,0.5)] tracking-tighter">404</h1>
        <div className="w-16 h-1 bg-primary/50 mb-8 rounded-full" />
        <p className="text-xl text-muted-foreground font-mono mb-8 uppercase tracking-widest">Signal lost. Sector unmapped.</p>
        <Link 
          href="/" 
          className="px-8 py-4 bg-primary/10 text-primary border border-primary/40 rounded-xl hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(218,165,32,0.3)] transition-all duration-300 font-display font-bold uppercase tracking-widest text-sm"
        >
          Return to Base Station
        </Link>
      </div>
    </Layout>
  );
}
