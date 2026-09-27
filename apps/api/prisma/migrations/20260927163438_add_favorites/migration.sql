-- CreateEnum
CREATE TYPE "favorite_kind" AS ENUM ('currency', 'indicator');

-- CreateTable
CREATE TABLE "favorites" (
    "client_id" UUID NOT NULL,
    "kind" "favorite_kind" NOT NULL,
    "item_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("client_id","kind","item_key")
);
