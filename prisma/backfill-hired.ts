/**
 * backfill-hired.ts
 *
 * One-time backfill: connects existing Job.status === "offer" rows to
 * the new HiredProfile / HiredOffer tables introduced in Phase 1A.
 *
 * Usage:
 *   npx tsx prisma/backfill-hired.ts            # dry-run (no DB changes)
 *   npx tsx prisma/backfill-hired.ts --execute  # write to DB
 *
 * Safe to re-run: already-linked jobs are skipped (idempotent).
 */

import { config } from "dotenv";
import path from "path";

// Load .env from the project root (one level above prisma/)
config({ path: path.resolve(__dirname, "../.env") });

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const isDryRun = !process.argv.includes("--execute");

async function main() {
  if (isDryRun) {
    console.log("=== DRY RUN (no DB changes) ===");
    console.log("Pass --execute to write to DB.\n");
  } else {
    console.log("=== EXECUTE MODE — writing to DB ===\n");
  }

  // 1. Find all offer jobs without a HiredOffer (regardless of deletedAt —
  //    createOfferTransition sets deletedAt when transitioning, so backfill
  //    targets may have deletedAt set)
  const offerJobs = await prisma.job.findMany({
    where: {
      status: "offer",
      hiredOffer: null,
    },
    select: {
      id: true,
      userId: true,
      title: true,
      company: true,
      appliedAt: true,
    },
    orderBy: { appliedAt: "asc" },
  });

  if (offerJobs.length === 0) {
    console.log("Nothing to backfill — no unlinked offer jobs found.");
    return;
  }

  // 2. Group by userId
  const byUser = new Map<string, typeof offerJobs>();
  for (const job of offerJobs) {
    const list = byUser.get(job.userId) ?? [];
    list.push(job);
    byUser.set(job.userId, list);
  }

  console.log(
    `Found ${offerJobs.length} unlinked offer job(s) across ${byUser.size} user(s):\n`
  );

  let profilesCreated = 0;
  let profilesSkipped = 0;
  let offersCreated = 0;

  for (const [userId, jobs] of byUser) {
    console.log(`User ${userId} — ${jobs.length} offer job(s):`);
    for (const j of jobs) {
      console.log(`  • [${j.id}] ${j.title} @ ${j.company} (applied ${j.appliedAt.toISOString().slice(0, 10)})`);
    }

    if (!isDryRun) {
      // 3. Upsert HiredProfile (one per user)
      const existing = await prisma.hiredProfile.findUnique({
        where: { userId },
      });

      let profileId: string;
      if (existing) {
        profileId = existing.id;
        profilesSkipped++;
        console.log(`  → HiredProfile already exists (${profileId}), skipping create.`);
      } else {
        const profile = await prisma.hiredProfile.create({
          data: { userId },
        });
        profileId = profile.id;
        profilesCreated++;
        console.log(`  → HiredProfile created (${profileId}).`);
      }

      // 4. Create HiredOffer for each job
      for (const job of jobs) {
        await prisma.hiredOffer.create({
          data: {
            hiredProfileId: profileId,
            jobId: job.id,
            status: "pending",
          },
        });
        offersCreated++;
        console.log(`  → HiredOffer created for job ${job.id}.`);
      }
    }

    console.log("");
  }

  if (isDryRun) {
    console.log("=== DRY RUN SUMMARY ===");
    console.log(`Would create: ${byUser.size} HiredProfile(s), ${offerJobs.length} HiredOffer(s)`);
    console.log("Run with --execute to apply.");
  } else {
    console.log("=== BACKFILL COMPLETE ===");
    console.log(`HiredProfiles: ${profilesCreated} created, ${profilesSkipped} already existed`);
    console.log(`HiredOffers:   ${offersCreated} created`);
  }
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
