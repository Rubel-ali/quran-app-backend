import { Hono } from "hono";
import { userIdMiddleware } from "../middleware/index";
import { getBookmarks, addBookmark, removeBookmark } from "../db/queries";

// ✅ Define Hono context variables type
type Variables = {
  userId: string;
};

const router = new Hono<{ Variables: Variables }>();

// Attach middleware
router.use("/*", userIdMiddleware);

// ─── GET /api/bookmarks ─────────────────────────────
router.get("/", async (c) => {
  const userId = c.get("userId");

  const bookmarks = await getBookmarks(userId);

  return c.json({
    success: true,
    data: bookmarks,
    meta: { total: bookmarks.length },
  });
});

// ─── POST /api/bookmarks ─────────────────────────────
// Body: { surah_number, ayah_number_in_surah, note? }
router.post("/", async (c) => {
  const userId = c.get("userId");

  let body: {
    surah_number?: number;
    ayah_number_in_surah?: number;
    note?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { surah_number, ayah_number_in_surah, note } = body;

  if (!surah_number || !ayah_number_in_surah) {
    return c.json(
      {
        success: false,
        error: "surah_number and ayah_number_in_surah are required",
      },
      400
    );
  }

  if (surah_number < 1 || surah_number > 114) {
    return c.json({ success: false, error: "Invalid surah number" }, 400);
  }

  const bookmark = await addBookmark(
    userId,
    surah_number,
    ayah_number_in_surah,
    note
  );

  if (!bookmark) {
    return c.json({ success: false, error: "Bookmark already exists" }, 409);
  }

  return c.json({ success: true, data: bookmark }, 201);
});

// ─── DELETE /api/bookmarks/:surah/:ayah ─────────────
router.delete("/:surah/:ayah", async (c) => {
  const userId = c.get("userId");

  const surahNumber = Number(c.req.param("surah"));
  const ayahNumber = Number(c.req.param("ayah"));

  if (isNaN(surahNumber) || isNaN(ayahNumber)) {
    return c.json(
      { success: false, error: "Invalid surah or ayah number" },
      400
    );
  }

  const removed = await removeBookmark(
    userId,
    surahNumber,
    ayahNumber
  );

  if (!removed) {
    return c.json({ success: false, error: "Bookmark not found" }, 404);
  }

  return c.json({ success: true, data: { deleted: true } });
});

export default router;