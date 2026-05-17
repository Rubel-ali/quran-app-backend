import { Hono } from "hono";
import { getAllSurahs } from "../db/queries";

const router = new Hono();

// GET /api/surahs
router.get("/", async (c) => {
  const surahs = await getAllSurahs();
  return c.json({
    success: true,
    data: surahs,
    meta: { total: surahs.length },
  });
});

export default router;
