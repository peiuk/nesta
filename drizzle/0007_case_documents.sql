CREATE TABLE `case_documents` (
 `case_id` text NOT NULL,
 `kind` text NOT NULL,
 `status` text DEFAULT 'not_started' NOT NULL,
 `status_date` text,
 `notes` text DEFAULT '' NOT NULL,
 `updated_at` text NOT NULL,
 `updated_by` text,
 PRIMARY KEY(`case_id`, `kind`),
 FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`),
 FOREIGN KEY (`updated_by`) REFERENCES `profiles`(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_case_documents_case` ON `case_documents` (`case_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `case_documents` (`case_id`,`kind`,`status`,`status_date`,`notes`,`updated_at`,`updated_by`)
 SELECT `id`,'birth_certificate','not_started',NULL,'',strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL FROM `cases`;
--> statement-breakpoint
INSERT OR IGNORE INTO `case_documents` (`case_id`,`kind`,`status`,`status_date`,`notes`,`updated_at`,`updated_by`)
 SELECT `id`,'parentage','not_started',NULL,'',strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL FROM `cases`;
--> statement-breakpoint
INSERT OR IGNORE INTO `case_documents` (`case_id`,`kind`,`status`,`status_date`,`notes`,`updated_at`,`updated_by`)
 SELECT `id`,'notarisation','not_started',NULL,'',strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL FROM `cases`;
--> statement-breakpoint
INSERT OR IGNORE INTO `case_documents` (`case_id`,`kind`,`status`,`status_date`,`notes`,`updated_at`,`updated_by`)
 SELECT `id`,'apostille','not_started',NULL,'',strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL FROM `cases`;
