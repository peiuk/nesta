CREATE TABLE `case_plans` (
 `case_id` text PRIMARY KEY NOT NULL REFERENCES `cases`(`id`),
 `tier` text NOT NULL,
 `total_usd` integer NOT NULL,
 `pgs_included` integer DEFAULT 6 NOT NULL,
 `pgs_extra_usd` integer DEFAULT 500 NOT NULL,
 `egg_status` text DEFAULT 'none' NOT NULL,
 `sperm_status` text DEFAULT 'none' NOT NULL,
 `twin_status` text DEFAULT 'none' NOT NULL,
 `csection_status` text DEFAULT 'none' NOT NULL,
 `nicu_status` text DEFAULT 'none' NOT NULL,
 `milestones_json` text NOT NULL,
 `note` text DEFAULT '' NOT NULL,
 `updated_at` text NOT NULL,
 `updated_by` text NOT NULL REFERENCES `profiles`(`id`)
);
