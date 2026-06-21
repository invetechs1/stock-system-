import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { placeOrder, getOrders, cancelOrder } from '../services/orderService.js';

const router = Router();
router.use(requireAuth);

const orderBody = z.object({
  side: z.enum(['BUY', 'SELL']),
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .transform((s) => s.toUpperCase()),
  shares: z.coerce.number().int().positive().max(1_000_000),
  limitPrice: z.coerce.number().positive().max(1_000_000)
});

// GET /api/orders
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(getOrders(req.userId));
  })
);

// POST /api/orders - place a limit order
router.post(
  '/',
  validate(orderBody),
  asyncHandler(async (req, res) => {
    res.status(201).json(placeOrder(req.userId, req.body));
  })
);

// DELETE /api/orders/:id - cancel a pending order
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(cancelOrder(req.userId, req.params.id));
  })
);

export default router;
