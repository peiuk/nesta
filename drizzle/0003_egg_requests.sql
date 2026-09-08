CREATE TABLE `egg_requests` (
 `id` text PRIMARY KEY NOT NULL,
 `user_id` text NOT NULL REFERENCES `profiles`(`id`),
 `donor_id` text NOT NULL REFERENCES `donors`(`id`),
 `donor_code` text NOT NULL,
 `status` text DEFAULT 'pending' NOT NULL,
 `note` text DEFAULT '' NOT NULL,
 `reply` text,
 `reviewed_by` text REFERENCES `profiles`(`id`),
 `created_at` text NOT NULL,
 `updated_at` text NOT NULL,
 `transition_token` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_egg_requests_user` ON `egg_requests` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_egg_requests_status` ON `egg_requests` (`status`,`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_egg_requests_active` ON `egg_requests` (`user_id`,`donor_id`) WHERE `status` IN ('pending','approved');
