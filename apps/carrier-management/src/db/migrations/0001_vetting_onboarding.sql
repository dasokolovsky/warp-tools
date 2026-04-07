-- Add vetting fields to carriers
ALTER TABLE `carriers` ADD `vetting_status` text DEFAULT 'not_started';
--> statement-breakpoint
ALTER TABLE `carriers` ADD `vetting_score` integer;
--> statement-breakpoint
ALTER TABLE `carriers` ADD `approved_at` text;
--> statement-breakpoint
ALTER TABLE `carriers` ADD `approved_by` text;
--> statement-breakpoint
ALTER TABLE `carriers` ADD `rejected_at` text;
--> statement-breakpoint
ALTER TABLE `carriers` ADD `rejection_reason` text;
--> statement-breakpoint
ALTER TABLE `carriers` ADD `onboarding_notes` text;
--> statement-breakpoint

-- Create carrier_vetting table
CREATE TABLE `carrier_vetting` (
	`id` text PRIMARY KEY NOT NULL,
	`carrier_id` text NOT NULL,
	`check_type` text NOT NULL,
	`status` text DEFAULT 'pending',
	`checked_at` text,
	`checked_by` text,
	`notes` text,
	`expiry_date` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON UPDATE no action ON DELETE cascade
);
