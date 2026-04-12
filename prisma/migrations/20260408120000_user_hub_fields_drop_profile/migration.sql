-- Move hub-facing fields onto User; remove Profile table (no data migration required).

-- AlterTable
ALTER TABLE "User" ADD COLUMN "hubStatus" "HubProfileStatus",
ADD COLUMN "headline" VARCHAR(500);

-- DropTable
DROP TABLE "Profile";
