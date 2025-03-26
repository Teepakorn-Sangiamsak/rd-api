/*
  Warnings:

  - You are about to drop the column `challenge_id` on the `user_proof` table. All the data in the column will be lost.
  - You are about to drop the column `proof_link` on the `user_proof` table. All the data in the column will be lost.
  - You are about to drop the column `submitted_at` on the `user_proof` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_proof` table. All the data in the column will be lost.
  - Added the required column `challengeId` to the `user_proof` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proofImage` to the `user_proof` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `user_proof` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `user_proof` DROP FOREIGN KEY `user_proof_challenge_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_proof` DROP FOREIGN KEY `user_proof_user_id_fkey`;

-- DropIndex
DROP INDEX `user_proof_challenge_id_fkey` ON `user_proof`;

-- DropIndex
DROP INDEX `user_proof_user_id_fkey` ON `user_proof`;

-- AlterTable
ALTER TABLE `user_proof` DROP COLUMN `challenge_id`,
    DROP COLUMN `proof_link`,
    DROP COLUMN `submitted_at`,
    DROP COLUMN `user_id`,
    ADD COLUMN `challengeId` INTEGER NOT NULL,
    ADD COLUMN `proofImage` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `user_proof` ADD CONSTRAINT `user_proof_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_proof` ADD CONSTRAINT `user_proof_challengeId_fkey` FOREIGN KEY (`challengeId`) REFERENCES `challenge`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
