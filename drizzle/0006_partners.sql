CREATE TABLE `partners` (
 `id` text PRIMARY KEY NOT NULL,
 `kind` text NOT NULL,
 `name` text NOT NULL,
 `contact_name` text DEFAULT '' NOT NULL,
 `phone` text DEFAULT '' NOT NULL,
 `email` text DEFAULT '' NOT NULL,
 `notes` text DEFAULT '' NOT NULL,
 `status` text DEFAULT 'active' NOT NULL,
 `created_at` text NOT NULL,
 `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_partners_kind_status` ON `partners` (`kind`,`status`);
--> statement-breakpoint
ALTER TABLE `cases` ADD `ivf_partner_id` text REFERENCES `partners`(`id`);
--> statement-breakpoint
ALTER TABLE `cases` ADD `postpartum_partner_id` text REFERENCES `partners`(`id`);
