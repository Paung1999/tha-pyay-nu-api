/*
  Warnings:

  - You are about to drop the column `shippingAddressId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `titleSnapshot` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPriceSnapshot` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "shippingAddressId";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "titleSnapshot" TEXT NOT NULL,
ADD COLUMN     "unitPriceSnapshot" INTEGER NOT NULL;
