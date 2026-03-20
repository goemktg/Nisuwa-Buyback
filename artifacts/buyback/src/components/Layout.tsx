import { ReactNode } from "react";
import { Link } from "wouter";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 dark">
      {/* Background image overlay with sci-fi grid/scanlines */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-25 mix-blend-luminosity"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Vignette and scanline overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-background/80 via-background/95 to-background" />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 bg-card/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Nisuwa Cartel"
                className="w-9 h-9 rounded-full ring-1 ring-primary/40 group-hover:ring-primary transition-all duration-300 drop-shadow-[0_0_8px_rgba(218,165,32,0.6)]"
              />
              <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 uppercase">
                Nisuwa Cartel
              </span>
            </Link>
            <div className="flex items-center gap-4">
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
