-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "profileName" TEXT NOT NULL DEFAULT 'Default',
ALTER COLUMN "originalText" DROP DEFAULT;
