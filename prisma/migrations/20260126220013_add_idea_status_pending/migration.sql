-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Idea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "yesCount" INTEGER NOT NULL DEFAULT 0,
    "noCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Idea" ("createdAt", "id", "noCount", "status", "text", "yesCount") SELECT "createdAt", "id", "noCount", "status", "text", "yesCount" FROM "Idea";
DROP TABLE "Idea";
ALTER TABLE "new_Idea" RENAME TO "Idea";
CREATE INDEX "Idea_status_idx" ON "Idea"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
