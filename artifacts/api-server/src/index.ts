import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { PYTHON_SERVICE_URL, pythonHeaders } from "./lib/config";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // NF-04: Campaign recovery — re-register active campaigns with Python after restart
  try {
    const activeCampaigns = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.status, "active"));

    if (activeCampaigns.length > 0) {
      logger.info({ count: activeCampaigns.length }, "Recovering active campaigns after restart");

      for (const campaign of activeCampaigns) {
        try {
          await fetch(`${PYTHON_SERVICE_URL}/campaigns/start`, {
            method: "POST",
            headers: pythonHeaders(),
            body: JSON.stringify({
              campaign: {
                ...campaign,
                targetGroupIds: Array.isArray(campaign.targetGroupIds) ? campaign.targetGroupIds : [],
                status: "active",
                delaySeconds: 5,
              },
            }),
            signal: AbortSignal.timeout(8000),
          });
          logger.info({ campaignId: campaign.id }, "Recovered campaign");
        } catch (e) {
          logger.warn({ campaignId: campaign.id, err: e }, "Could not recover campaign (Python may not be ready yet)");
        }
      }
    }
  } catch (e) {
    logger.warn({ err: e }, "Campaign recovery check failed");
  }
});
