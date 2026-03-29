import { SimpleCache } from "./cache.js";
import { logger } from "./logger.js";

const ESI_BASE = "https://esi.evetech.net/latest";
const FUZZWORK_BASE = "https://market.fuzzwork.co.uk/aggregates";

const typeIdCache = new SimpleCache<number>(86400);
const priceCache = new SimpleCache<FuzzworkPriceData>(3600);
const typeInfoCache = new SimpleCache<TypeInfo>(86400);
const npcPriceCache = new SimpleCache<number>(2592000);

export interface FuzzworkPriceData {
  buy: { max: number; min: number; avg: number; volume: number };
  sell: { min: number; max: number; avg: number; volume: number };
}

export interface TypeInfo {
  typeId: number;
  name: string;
  marketGroupId: number | null;
  marketGroupName: string;
}

export async function resolveTypeIds(
  names: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const uncached: string[] = [];

  for (const name of names) {
    const cached = typeIdCache.get(name.toLowerCase());
    if (cached !== undefined) {
      result.set(name, cached);
    } else {
      uncached.push(name);
    }
  }

  if (uncached.length === 0) return result;

  const batchSize = 500;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    try {
      const resp = await fetch(
        `${ESI_BASE}/universe/ids/?datasource=tranquility`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        },
      );
      if (!resp.ok) {
        logger.warn({ status: resp.status }, "ESI universe/ids failed");
        continue;
      }
      const data = (await resp.json()) as {
        inventory_types?: Array<{ id: number; name: string }>;
      };

      if (data.inventory_types) {
        for (const item of data.inventory_types) {
          const originalName = batch.find(
            (n) => n.toLowerCase() === item.name.toLowerCase(),
          );
          if (originalName) {
            typeIdCache.set(originalName.toLowerCase(), item.id);
            result.set(originalName, item.id);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, "ESI universe/ids error");
    }
  }

  return result;
}

export async function getJitaPrices(
  typeIds: number[],
): Promise<Map<number, FuzzworkPriceData>> {
  const result = new Map<number, FuzzworkPriceData>();
  const uncachedIds: number[] = [];

  for (const id of typeIds) {
    const cached = priceCache.get(String(id));
    if (cached) {
      result.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  }

  if (uncachedIds.length === 0) return result;

  const batchSize = 100;
  for (let i = 0; i < uncachedIds.length; i += batchSize) {
    const batch = uncachedIds.slice(i, i + batchSize);
    try {
      const url = `${FUZZWORK_BASE}/?station=60003760&types=${batch.join(",")}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        logger.warn(
          { status: resp.status },
          "Fuzzwork price fetch failed",
        );
        continue;
      }
      const data = (await resp.json()) as Record<
        string,
        {
          buy: {
            weightedAverage: string;
            max: string;
            min: string;
            stddev: string;
            median: string;
            volume: string;
            orderCount: string;
            percentile: string;
          };
          sell: {
            weightedAverage: string;
            min: string;
            max: string;
            stddev: string;
            median: string;
            volume: string;
            orderCount: string;
            percentile: string;
          };
        }
      >;

      for (const [idStr, priceInfo] of Object.entries(data)) {
        const priceData: FuzzworkPriceData = {
          buy: {
            max: parseFloat(priceInfo.buy.max),
            min: parseFloat(priceInfo.buy.min),
            avg: parseFloat(priceInfo.buy.weightedAverage),
            volume: parseFloat(priceInfo.buy.volume),
          },
          sell: {
            min: parseFloat(priceInfo.sell.min),
            max: parseFloat(priceInfo.sell.max),
            avg: parseFloat(priceInfo.sell.weightedAverage),
            volume: parseFloat(priceInfo.sell.volume),
          },
        };
        priceCache.set(idStr, priceData);
        result.set(parseInt(idStr, 10), priceData);
      }
    } catch (err) {
      logger.error({ err }, "Fuzzwork price fetch error");
    }
  }

  return result;
}

export async function getTypeInfo(typeId: number): Promise<TypeInfo | null> {
  const cacheKey = String(typeId);
  const cached = typeInfoCache.get(cacheKey);
  if (cached) return cached;

  try {
    const resp = await fetch(
      `${ESI_BASE}/universe/types/${typeId}/?datasource=tranquility`,
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      type_id: number;
      name: string;
      market_group_id?: number;
    };

    let marketGroupName = "Unknown";
    if (data.market_group_id) {
      marketGroupName = await getMarketGroupName(data.market_group_id);
    }

    const info: TypeInfo = {
      typeId: data.type_id,
      name: data.name,
      marketGroupId: data.market_group_id ?? null,
      marketGroupName,
    };
    typeInfoCache.set(cacheKey, info);
    return info;
  } catch (err) {
    logger.error({ err, typeId }, "ESI type info error");
    return null;
  }
}

const SLEEPER_COMPONENT_MARKER = "Sleeper Components";

export function isSleeperComponent(marketGroupName: string): boolean {
  return marketGroupName.includes(SLEEPER_COMPONENT_MARKER);
}

const NPC_BUY_MARKERS = ["Sleeper Components", "AEGIS"];

export function isNpcBuyItem(marketGroupName: string): boolean {
  return NPC_BUY_MARKERS.some((m) => marketGroupName.includes(m));
}

export async function getNpcBuyPrice(typeId: number): Promise<number | null> {
  const cacheKey = `npc-buy-${typeId}`;
  const cached = npcPriceCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const regionId = 10000002;
  let highestNpcBuy = 0;

  try {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const url = `${ESI_BASE}/markets/${regionId}/orders/?datasource=tranquility&order_type=buy&type_id=${typeId}&page=${page}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        if (resp.status === 404) break;
        logger.warn({ status: resp.status, typeId }, "ESI market orders fetch failed");
        break;
      }
      const orders = (await resp.json()) as Array<{
        price: number;
        duration: number;
        is_buy_order: boolean;
        volume_remain: number;
      }>;

      for (const order of orders) {
        if (order.duration >= 365 && order.is_buy_order && order.price > highestNpcBuy) {
          highestNpcBuy = order.price;
        }
      }

      const totalPages = parseInt(resp.headers.get("x-pages") ?? "1", 10);
      hasMore = page < totalPages;
      page++;
    }
  } catch (err) {
    logger.error({ err, typeId }, "ESI NPC buy price fetch error");
    return null;
  }

  if (highestNpcBuy > 0) {
    npcPriceCache.set(cacheKey, highestNpcBuy);
    return highestNpcBuy;
  }

  return null;
}

const marketGroupNameCache = new SimpleCache<string>(86400);

async function getMarketGroupName(groupId: number): Promise<string> {
  const cacheKey = String(groupId);
  const cached = marketGroupNameCache.get(cacheKey);
  if (cached) return cached;

  try {
    const resp = await fetch(
      `${ESI_BASE}/markets/groups/${groupId}/?datasource=tranquility`,
    );
    if (!resp.ok) return "Unknown";
    const data = (await resp.json()) as {
      name: string;
      parent_group_id?: number;
    };

    let name = data.name;
    if (data.parent_group_id) {
      const parentName = await getMarketGroupName(data.parent_group_id);
      name = `${parentName} > ${data.name}`;
    }

    marketGroupNameCache.set(cacheKey, name);
    return name;
  } catch {
    return "Unknown";
  }
}
