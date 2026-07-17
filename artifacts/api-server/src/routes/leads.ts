import { Router, type IRouter } from "express";
import { db, insertLeadSchema, leadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/leads", async (req, res) => {
  const parsed = insertLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: "Invalid email address." });
    return;
  }

  try {
    const [lead] = await db
      .insert(leadsTable)
      .values(parsed.data)
      .returning();

    res.status(201).json({
      id: lead.id,
      email: lead.email,
      createdAt: lead.createdAt,
    });
  } catch (err: any) {
    // Drizzle wraps the pg error; check both the top-level and cause
    const pgCode = err?.code ?? err?.cause?.code;
    if (pgCode === "23505") {
      res.status(409).json({ error: "You're already on the list!" });
      return;
    }
    throw err;
  }
});

export default router;
