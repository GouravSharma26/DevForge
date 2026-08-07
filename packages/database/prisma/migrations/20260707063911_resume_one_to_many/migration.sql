-- DropIndex
DROP INDEX "Resume_userId_key";

-- AlterTable
ALTER TABLE "Resume" ALTER COLUMN "originalText" SET DEFAULT 'Default';

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");
