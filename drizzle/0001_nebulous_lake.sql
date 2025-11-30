CREATE TABLE `fee_claims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position_id` integer NOT NULL,
	`fees_a` text NOT NULL,
	`fees_b` text NOT NULL,
	`claimed_at` integer NOT NULL,
	`tx_hash` text,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `fee_claims_position_id_idx` ON `fee_claims` (`position_id`);--> statement-breakpoint
CREATE TABLE `idempotency_store` (
	`key` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`response` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idempotency_store_created_at_idx` ON `idempotency_store` (`created_at`);--> statement-breakpoint
CREATE TABLE `price_feeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pool_id` integer NOT NULL,
	`price` real NOT NULL,
	`reserve_a` text NOT NULL,
	`reserve_b` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`pool_id`) REFERENCES `pools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `price_feeds_pool_timestamp_idx` ON `price_feeds` (`pool_id`,`timestamp`);--> statement-breakpoint
ALTER TABLE `pools` ADD `fee_per_share` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pools` ADD `total_shares` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pools` ADD `version` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `pools` ADD `protocol_fees_a` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pools` ADD `protocol_fees_b` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `positions` ADD `shares` real NOT NULL;--> statement-breakpoint
ALTER TABLE `positions` ADD `entry_fee_per_share` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `positions` ADD `nft_token_id` text;--> statement-breakpoint
ALTER TABLE `positions` ADD `nft_tx_hash` text;--> statement-breakpoint
ALTER TABLE `positions` ADD `mint_pending` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `positions` ADD `version` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `swaps` ADD `idempotency_key` text;--> statement-breakpoint
ALTER TABLE `swaps` ADD `deadline` integer;--> statement-breakpoint
ALTER TABLE `swaps` ADD `min_amount_out` text;--> statement-breakpoint
ALTER TABLE `swaps` ADD `actual_price_impact` real;--> statement-breakpoint
ALTER TABLE `swaps` ADD `signature` text;--> statement-breakpoint
CREATE UNIQUE INDEX `swaps_idempotency_key_unique` ON `swaps` (`idempotency_key`);