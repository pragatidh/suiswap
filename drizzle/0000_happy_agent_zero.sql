CREATE TABLE `pools` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_a_id` integer NOT NULL,
	`token_b_id` integer NOT NULL,
	`reserve_a` text NOT NULL,
	`reserve_b` text NOT NULL,
	`fee_tier` integer NOT NULL,
	`total_supply` text NOT NULL,
	`tvl` real NOT NULL,
	`volume_24h` real NOT NULL,
	`apy` real NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`token_a_id`) REFERENCES `tokens`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`token_b_id`) REFERENCES `tokens`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pool_id` integer NOT NULL,
	`owner_address` text NOT NULL,
	`liquidity` text NOT NULL,
	`accumulated_fees_a` text NOT NULL,
	`accumulated_fees_b` text NOT NULL,
	`share_percentage` real NOT NULL,
	`value_usd` real NOT NULL,
	`created_at` text NOT NULL,
	`last_fee_claim` text NOT NULL,
	FOREIGN KEY (`pool_id`) REFERENCES `pools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `swaps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pool_id` integer NOT NULL,
	`user_address` text NOT NULL,
	`token_in_id` integer NOT NULL,
	`token_out_id` integer NOT NULL,
	`amount_in` text NOT NULL,
	`amount_out` text NOT NULL,
	`fee` text NOT NULL,
	`price_impact` real NOT NULL,
	`tx_digest` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`pool_id`) REFERENCES `pools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`token_in_id`) REFERENCES `tokens`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`token_out_id`) REFERENCES `tokens`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `swaps_tx_digest_unique` ON `swaps` (`tx_digest`);--> statement-breakpoint
CREATE TABLE `tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`decimals` integer NOT NULL,
	`address` text NOT NULL,
	`logo_url` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_symbol_unique` ON `tokens` (`symbol`);