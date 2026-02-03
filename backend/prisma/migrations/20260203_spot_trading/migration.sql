-- CreateTable Portfolio
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "assets" JSONB NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateTable CryptoMarket
CREATE TABLE "CryptoMarket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL UNIQUE,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "lastPrice" REAL NOT NULL DEFAULT 0,
    "high24h" REAL NOT NULL DEFAULT 0,
    "low24h" REAL NOT NULL DEFAULT 0,
    "volume24h" REAL NOT NULL DEFAULT 0,
    "changePercent24h" REAL NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Order
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "filledQuantity" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "totalCost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "filledAt" DATETIME,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateTable Trade
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "executionPrice" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "totalValue" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" on "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "CryptoMarket_symbol_idx" on "CryptoMarket"("symbol");

-- CreateIndex
CREATE INDEX "Order_userId_idx" on "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_symbol_idx" on "Order"("symbol");

-- CreateIndex
CREATE INDEX "Order_status_idx" on "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" on "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Trade_userId_idx" on "Trade"("userId");

-- CreateIndex
CREATE INDEX "Trade_orderId_idx" on "Trade"("orderId");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" on "Trade"("symbol");

-- CreateIndex
CREATE INDEX "Trade_createdAt_idx" on "Trade"("createdAt");
