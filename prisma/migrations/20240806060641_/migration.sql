/*
  Warnings:

  - A unique constraint covering the columns `[category]` on the table `Post` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "category" TEXT NOT NULL DEFAULT '카테고리 미지정',
ADD COLUMN     "image" TEXT NOT NULL DEFAULT '/public/1234.JPG';

-- CreateIndex
CREATE UNIQUE INDEX "Post_category_key" ON "Post"("category");
