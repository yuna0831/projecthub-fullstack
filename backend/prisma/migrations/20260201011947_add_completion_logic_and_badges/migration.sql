-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "completionRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completionVotes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "completedProjectCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
