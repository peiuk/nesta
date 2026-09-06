CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_created` ON `audit` (`created_at`);--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`stage` text DEFAULT 'assessment' NOT NULL,
	`cycle` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cases_code` ON `cases` (`code`);--> statement-breakpoint
CREATE TABLE `donors` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`kind` text NOT NULL,
	`age` integer NOT NULL,
	`height` integer,
	`blood_group` text DEFAULT '' NOT NULL,
	`source` text NOT NULL,
	`summary_zh` text NOT NULL,
	`summary_en` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`verified_at` text NOT NULL,
	`consent_ref` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_donors_code` ON `donors` (`code`);--> statement-breakpoint
CREATE INDEX `idx_donors_kind_status` ON `donors` (`kind`,`status`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`cycle` integer NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`event_date` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_case` ON `events` (`case_id`,`event_date`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_id` text NOT NULL,
	`donor_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `donor_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`donor_id`) REFERENCES `donors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `directory_grants` (
	`user_id` text NOT NULL,
	`scope` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`reason` text NOT NULL,
	`granted_by` text NOT NULL,
	PRIMARY KEY(`user_id`, `scope`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`granted_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `case_members` (
	`case_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`case_id`, `user_id`),
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_members_user` ON `case_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'client' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`language` text DEFAULT 'zh' NOT NULL,
	`jurisdiction` text DEFAULT '' NOT NULL,
	`interest` text DEFAULT '' NOT NULL,
	`registered_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_profiles_status` ON `profiles` (`status`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`reply` text,
	`replied_by` text,
	`created_at` text NOT NULL,
	`replied_at` text,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`replied_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_questions_case` ON `questions` (`case_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `report_recipients` (
	`report_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`report_id`, `user_id`),
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`cycle` integer NOT NULL,
	`title` text NOT NULL,
	`kind` text DEFAULT 'report' NOT NULL,
	`source` text NOT NULL,
	`report_date` text NOT NULL,
	`language` text NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`sha256` text NOT NULL,
	`translation_key` text,
	`translation_name` text,
	`translation_mime` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`uploaded_by` text NOT NULL,
	`reviewed_by` text,
	`review_note` text,
	`published_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`supersedes_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reports_case` ON `reports` (`case_id`,`status`);