/*
  Warnings:

  - You are about to drop the column `like` on the `Comment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "like";

-- CreateTable
CREATE TABLE "CommentOnUser" (
    "userId" TEXT NOT NULL,
    "likeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentOnUser_pkey" PRIMARY KEY ("userId","likeId")
);

-- AddForeignKey
ALTER TABLE "CommentOnUser" ADD CONSTRAINT "CommentOnUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentOnUser" ADD CONSTRAINT "CommentOnUser_likeId_fkey" FOREIGN KEY ("likeId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
