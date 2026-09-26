-- CreateEnum
CREATE TYPE "currency_type" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "bulletin" AS ENUM ('opening', 'intermediate', 'closing');

-- CreateEnum
CREATE TYPE "sync_status" AS ENUM ('success', 'failure');

-- CreateTable
CREATE TABLE "currencies" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "currency_type" NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "currency_quotes" (
    "currency_code" TEXT NOT NULL,
    "quoted_at" TIMESTAMPTZ(6) NOT NULL,
    "bulletin" "bulletin" NOT NULL,
    "quote_date" DATE NOT NULL,
    "bid" DECIMAL(20,8) NOT NULL,
    "ask" DECIMAL(20,8) NOT NULL,
    "bid_parity" DECIMAL(20,8) NOT NULL,
    "ask_parity" DECIMAL(20,8) NOT NULL,
    "fetched_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_quotes_pkey" PRIMARY KEY ("currency_code","quoted_at","bulletin")
);

-- CreateTable
CREATE TABLE "sync_state" (
    "currency_code" TEXT NOT NULL,
    "last_attempt_at" TIMESTAMPTZ(3),
    "last_success_at" TIMESTAMPTZ(3),
    "last_status" "sync_status",
    "last_error" TEXT,
    "last_observation_date" DATE,

    CONSTRAINT "sync_state_pkey" PRIMARY KEY ("currency_code")
);

-- AddForeignKey
ALTER TABLE "currency_quotes" ADD CONSTRAINT "currency_quotes_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_state" ADD CONSTRAINT "sync_state_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
