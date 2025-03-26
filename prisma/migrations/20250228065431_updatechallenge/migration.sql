-- AlterTable
ALTER TABLE `challenge` ADD COLUMN `created_by` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `challenge` ADD CONSTRAINT `challenge_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
