import { Router, type IRouter } from "express";
import { GetBuybackRatesResponse } from "@workspace/api-zod";
import {
  BUYBACK_CATEGORIES,
  DEFAULT_BUYBACK_RATE,
} from "../lib/buyback-rates.js";

const router: IRouter = Router();

router.get("/buyback/rates", (_req, res): void => {
  const result = GetBuybackRatesResponse.parse({
    defaultRate: DEFAULT_BUYBACK_RATE,
    rates: BUYBACK_CATEGORIES.map((c) => ({
      rate: c.rate,
      items: [...c.items],
    })),
  });
  res.json(result);
});

export default router;
