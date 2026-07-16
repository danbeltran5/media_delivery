-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "showAccessForm" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "watermark" BOOLEAN NOT NULL DEFAULT true;
