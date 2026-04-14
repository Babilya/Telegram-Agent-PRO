import { Router } from "express";
import { db } from "@workspace/db";
import { parsedContactsTable } from "@workspace/db";
import { desc, ilike, eq, and, or } from "drizzle-orm";

const router = Router();

router.get("/contacts", async (req, res) => {
  try {
    const { search, sourceGroup } = req.query;

    // B-03: Push filtering into SQL instead of loading all rows into memory
    const conditions = [];

    if (search) {
      const q = `%${(search as string).toLowerCase()}%`;
      conditions.push(
        or(
          ilike(parsedContactsTable.firstName, q),
          ilike(parsedContactsTable.lastName, q),
          ilike(parsedContactsTable.username, q),
          ilike(parsedContactsTable.phone, q),
          ilike(parsedContactsTable.telegramId, q),
        )
      );
    }

    if (sourceGroup) {
      conditions.push(eq(parsedContactsTable.sourceGroup, sourceGroup as string));
    }

    const contacts = conditions.length > 0
      ? await db
          .select()
          .from(parsedContactsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(parsedContactsTable.createdAt))
      : await db
          .select()
          .from(parsedContactsTable)
          .orderBy(desc(parsedContactsTable.createdAt));

    res.json({ contacts, total: contacts.length });
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
