CREATE TABLE `donor_photos` (
 `id` text PRIMARY KEY NOT NULL,
 `donor_id` text NOT NULL REFERENCES `donors`(`id`),
 `object_key` text NOT NULL,
 `mime` text NOT NULL,
 `size` integer NOT NULL,
 `uploaded_by` text NOT NULL REFERENCES `profiles`(`id`),
 `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_donor_photos_donor` ON `donor_photos` (`donor_id`,`created_at`,`id`);
--> statement-breakpoint
CREATE TRIGGER `donor_photos_limit` BEFORE INSERT ON `donor_photos`
WHEN (SELECT COUNT(*) FROM `donor_photos` WHERE `donor_id`=NEW.`donor_id`) >= 10
BEGIN SELECT RAISE(ABORT, 'PHOTO_LIMIT'); END;
