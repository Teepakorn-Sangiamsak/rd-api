/*
  Warnings:

  - You are about to drop the column `proofImage` on the `user_proof` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `user_proof` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `user_proof` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `VarChar(191)`.
  - Added the required column `proof_images` to the `user_proof` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user_proof` DROP COLUMN `proofImage`,
    DROP COLUMN `submittedAt`,
    ADD COLUMN `proof_images` JSON NOT NULL,
    ADD COLUMN `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';
