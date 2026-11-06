CREATE TABLE `otp_ip_limits` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`window_started_at` text NOT NULL,
	`requests` integer DEFAULT 0 NOT NULL
);
