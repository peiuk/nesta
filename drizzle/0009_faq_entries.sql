CREATE TABLE `faq_entries` (
 `id` text PRIMARY KEY NOT NULL,
 `question_zh` text NOT NULL,
 `question_en` text NOT NULL,
 `answer_zh` text NOT NULL,
 `answer_en` text NOT NULL,
 `position` integer NOT NULL,
 `hidden` integer DEFAULT 0 NOT NULL,
 `updated_at` text NOT NULL,
 `updated_by` text
);
--> statement-breakpoint
CREATE INDEX `idx_faq_entries_position` ON `faq_entries` (`position`,`id`);
