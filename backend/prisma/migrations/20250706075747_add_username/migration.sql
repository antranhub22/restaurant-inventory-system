-- Add username field to User table
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Make username unique and not null
UPDATE "User" SET "username" = "email" WHERE "username" IS NULL;
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username"); 