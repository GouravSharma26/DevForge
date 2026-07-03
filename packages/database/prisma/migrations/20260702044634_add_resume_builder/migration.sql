-- CreateTable
CREATE TABLE "ResumeBuilder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'modern',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeBuilder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeBuilder_userId_key" ON "ResumeBuilder"("userId");

-- AddForeignKey
ALTER TABLE "ResumeBuilder" ADD CONSTRAINT "ResumeBuilder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
