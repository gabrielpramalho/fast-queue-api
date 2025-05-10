/*
  Warnings:

  - Added the required column `title` to the `queues` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "queues" ADD COLUMN     "title" TEXT NOT NULL;
