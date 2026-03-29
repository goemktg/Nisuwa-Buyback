import { Router, type IRouter } from "express";
import { AppraiseItemsBody, AppraiseItemsResponse } from "@workspace/api-zod";
import { parseEveItemText } from "../lib/eve-parser.js";
import {
  resolveTypeIds,
  getJitaPrices,
  getTypeInfo,
  isNpcBuyItem,
  getNpcBuyPrice,
} from "../lib/eve-api.js";
import { getBuybackRate } from "../lib/buyback-rates.js";

const router: IRouter = Router();

router.post("/appraise", async (req, res): Promise<void> => {
  const parsed = AppraiseItemsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const parsedItems = parseEveItemText(parsed.data.items);
  if (parsedItems.length === 0) {
    res.status(400).json({ error: "No valid items found in input" });
    return;
  }

  req.log.info({ itemCount: parsedItems.length }, "Appraising items");

  const nameToId = await resolveTypeIds(parsedItems.map((i) => i.name));

  const resolvedTypeIds = Array.from(nameToId.values());
  const prices = await getJitaPrices(resolvedTypeIds);

  const resultItems: Array<{
    typeName: string;
    typeId: number;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    marketGroupName: string;
    buybackRate: number;
    buybackPrice: number;
  }> = [];

  const typeInfoPromises = resolvedTypeIds.map((id) => getTypeInfo(id));
  const typeInfoResults = await Promise.all(typeInfoPromises);
  const typeInfoMap = new Map<number, { marketGroupName: string }>();
  for (const info of typeInfoResults) {
    if (info) {
      typeInfoMap.set(info.typeId, {
        marketGroupName: info.marketGroupName,
      });
    }
  }

  const npcBuyTypeIds = resolvedTypeIds.filter((id) => {
    const info = typeInfoMap.get(id);
    return info && isNpcBuyItem(info.marketGroupName);
  });
  const npcPricePromises = npcBuyTypeIds.map(async (id) => {
    const price = await getNpcBuyPrice(id);
    return [id, price] as const;
  });
  const npcPriceResults = await Promise.all(npcPricePromises);
  const npcPriceMap = new Map<number, number>();
  for (const [id, price] of npcPriceResults) {
    if (price !== null) npcPriceMap.set(id, price);
  }

  for (const item of parsedItems) {
    const typeId = nameToId.get(item.name);
    if (!typeId) {
      resultItems.push({
        typeName: item.name,
        typeId: 0,
        quantity: item.quantity,
        pricePerUnit: 0,
        totalPrice: 0,
        marketGroupName: "Unknown",
        buybackRate: 0,
        buybackPrice: 0,
      });
      continue;
    }

    const info = typeInfoMap.get(typeId);
    const marketGroupName = info?.marketGroupName ?? "Unknown";

    let pricePerUnit: number;
    if (isNpcBuyItem(marketGroupName) && npcPriceMap.has(typeId)) {
      pricePerUnit = npcPriceMap.get(typeId)!;
    } else {
      const priceData = prices.get(typeId);
      pricePerUnit = priceData ? priceData.buy.max : 0;
    }

    const totalPrice = pricePerUnit * item.quantity;
    const buybackRate = getBuybackRate(item.name);
    const buybackPrice = totalPrice * buybackRate;

    resultItems.push({
      typeName: item.name,
      typeId,
      quantity: item.quantity,
      pricePerUnit: Math.round(pricePerUnit * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
      marketGroupName,
      buybackRate,
      buybackPrice: Math.round(buybackPrice * 100) / 100,
    });
  }

  const totalValue = resultItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const totalBuybackValue = resultItems.reduce(
    (sum, i) => sum + i.buybackPrice,
    0,
  );

  const result = AppraiseItemsResponse.parse({
    items: resultItems,
    totalValue: Math.round(totalValue * 100) / 100,
    totalBuybackValue: Math.round(totalBuybackValue * 100) / 100,
    timestamp: new Date(),
  });

  res.json(result);
});

export default router;
