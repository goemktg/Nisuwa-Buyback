const RATE_KEYWORDS: Array<{ keyword: string; label: string; rate: number }> = [
  { keyword: "minerals", label: "Minerals", rate: 90 },
  { keyword: "ore", label: "Ore", rate: 85 },
  { keyword: "ice product", label: "Ice Product", rate: 85 },
  { keyword: "ice", label: "Ice", rate: 80 },
  { keyword: "moon materials", label: "Moon Materials", rate: 85 },
  { keyword: "moon ore", label: "Moon Ore", rate: 80 },
  { keyword: "planetary materials", label: "Planetary Materials", rate: 85 },
  { keyword: "salvage materials", label: "Salvage Materials", rate: 85 },
  { keyword: "gas", label: "Gas", rate: 80 },
  { keyword: "datacores", label: "Datacores", rate: 80 },
  { keyword: "ship equipment", label: "Ship Equipment", rate: 70 },
  { keyword: "drone", label: "Drone", rate: 70 },
  { keyword: "ammunition & charges", label: "Ammunition & Charges", rate: 70 },
  { keyword: "blueprint", label: "Blueprint", rate: 50 },
  { keyword: "ship", label: "Ship", rate: 65 },
  { keyword: "deployable", label: "Deployable", rate: 65 },
  { keyword: "structure", label: "Structure", rate: 60 },
  { keyword: "implant & booster", label: "Implant & Booster", rate: 75 },
  { keyword: "commodity", label: "Commodity", rate: 85 },
  { keyword: "abyssal materials", label: "Abyssal Materials", rate: 80 },
  { keyword: "triglavian", label: "Triglavian", rate: 75 },
];

export function getRateReason(marketGroupName: string, buybackRate: number): string {
  const lower = marketGroupName.toLowerCase();
  for (const entry of RATE_KEYWORDS) {
    if (lower.includes(entry.keyword)) {
      return `Category: ${entry.label} → ${entry.rate}%`;
    }
  }
  const defaultRate = Math.round(buybackRate * 100);
  return `Default rate → ${defaultRate}%`;
}
