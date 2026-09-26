-- CreateEnum
CREATE TYPE "indicator_source" AS ENUM ('fred', 'sgs');

-- CreateEnum
CREATE TYPE "indicator_frequency" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'annual');

-- CreateTable
CREATE TABLE "indicators" (
    "source" "indicator_source" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" "indicator_frequency" NOT NULL,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("source","code")
);

-- CreateTable
CREATE TABLE "indicator_observations" (
    "source" "indicator_source" NOT NULL,
    "code" TEXT NOT NULL,
    "observation_date" DATE NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "fetched_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicator_observations_pkey" PRIMARY KEY ("source","code","observation_date")
);

-- CreateTable
CREATE TABLE "indicator_sync_state" (
    "source" "indicator_source" NOT NULL,
    "code" TEXT NOT NULL,
    "last_attempt_at" TIMESTAMPTZ(3),
    "last_success_at" TIMESTAMPTZ(3),
    "last_status" "sync_status",
    "last_error" TEXT,
    "last_observation_date" DATE,

    CONSTRAINT "indicator_sync_state_pkey" PRIMARY KEY ("source","code")
);

-- AddForeignKey
ALTER TABLE "indicator_observations" ADD CONSTRAINT "indicator_observations_source_code_fkey" FOREIGN KEY ("source", "code") REFERENCES "indicators"("source", "code") ON DELETE RESTRICT ON UPDATE CASCADE;
