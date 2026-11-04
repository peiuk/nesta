CREATE TABLE `case_payments` (
 `id` text PRIMARY KEY NOT NULL,
 `case_id` text NOT NULL REFERENCES `cases`(`id`),
 `amount` integer NOT NULL,
 `currency` text NOT NULL,
 `paid_on` text NOT NULL,
 `voucher` text DEFAULT '' NOT NULL,
 `note` text DEFAULT '' NOT NULL,
 `created_at` text NOT NULL,
 `created_by` text NOT NULL REFERENCES `profiles`(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_case_payments_case` ON `case_payments` (`case_id`,`paid_on`);
--> statement-breakpoint
ALTER TABLE `case_plans` ADD `currency` text DEFAULT 'USD' NOT NULL;
--> statement-breakpoint
ALTER TABLE `case_plans` ADD `package_version` text DEFAULT 'legacy-2026-09' NOT NULL;
--> statement-breakpoint
ALTER TABLE `case_plans` ADD `pgs_scope` text DEFAULT 'count' NOT NULL;
