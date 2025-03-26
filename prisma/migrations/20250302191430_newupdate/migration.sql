/*
  Warnings:

  - You are about to drop the column `proof_images` on the `user_proof` table. All the data in the column will be lost.
  - You are about to drop the column `submitted_at` on the `user_proof` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user_proof` DROP COLUMN `proof_images`,
    DROP COLUMN `submitted_at`,
    ADD COLUMN `proofImages` JSON NOT NULL,
    ADD COLUMN `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
