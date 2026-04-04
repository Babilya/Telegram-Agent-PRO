import { Router } from "express";
import { db } from "@workspace/db";
import { parsedContactsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/contacts", async (req, res) => {
  try {
    const { search, sourceGroup } = req.query;
    let query = db.select().from(parsedContactsTable).orderBy(desc(parsedContactsTable.createdAt));
    const contacts = await query;

    const filtered = contacts.filter(c => {
      if (search) {
        const q = (search as string).toLowerCase();
        const matches = [c.firstName, c.lastName, c.username, c.phone, c.telegramId]
          .some(f => f?.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (sourceGroup && c.sourceGroup !== sourceGroup) return false;
      return true;
    });

    res.json({ contacts: filtered, total: filtered.length });
  } catch (err) {
    req.log.error({ err }, "List contacts error");
    res.status(500).json({ contacts: [], total: 0 });
  }
});

router.post("/contacts/batch", async (req, res) => {
  try {
    const { contacts, sourceGroup } = req.body as {
      contacts: Array<{
        telegramId: string | number;
        firstName?: string | null;
        lastName?: string | null;
        username?: string | null;
        phone?: string | null;
        isBot?: boolean;
        isPremium?: boolean;
      }>;
      sourceGroup?: string;
    };

    if (!Array.isArray(contacts) || contacts.length === 0) {
      res.status(400).json({ success: false, message: "contacts array required" });
      return;
    }

    const rows = contacts.map(c => ({
      telegramId: String(c.telegramId),
      firstName: c.firstName ?? null,
      lastName: c.lastName ?? null,
      username: c.username ?? null,
      phone: c.phone ?? null,
      isBot: c.isBot ?? false,
      isPremium: c.isPremium ?? false,
      sourceGroup: sourceGroup ?? null,
    }));

    const inserted = await db.insert(parsedContactsTable)
      .values(rows)
      .onConflictDoNothing()
      .returning();

    res.json({ success: true, saved: inserted.length, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Batch save contacts error");
    res.status(500).json({ success: false, message: "Failed to save contacts" });
  }
});

router.delete("/contacts/all", async (req, res) => {
  try {
    await db.delete(parsedContactsTable);
    res.json({ success: true, message: "All contacts deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete contacts error");
    res.status(500).json({ success: false, message: "Failed to delete contacts" });
  }
});

export default router;
