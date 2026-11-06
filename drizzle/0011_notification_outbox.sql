CREATE TABLE `notification_outbox` (
 `id` text PRIMARY KEY NOT NULL,
 `dedupe_key` text NOT NULL UNIQUE,
 `recipient` text NOT NULL,
 `subject` text NOT NULL,
 `body` text NOT NULL,
 `status` text NOT NULL DEFAULT 'pending',
 `attempts` integer NOT NULL DEFAULT 0,
 `available_at` text NOT NULL,
 `locked_at` text,
 `last_error` text,
 `created_at` text NOT NULL,
 `sent_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_notification_outbox_due` ON `notification_outbox` (`status`,`available_at`);
