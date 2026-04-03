CREATE TABLE `carrier_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`carrier_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'other',
	`phone` text,
	`email` text,
	`is_primary` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `carrier_insurance` (
	`id` text PRIMARY KEY NOT NULL,
	`carrier_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text,
	`policy_number` text,
	`coverage_amount` real,
	`effective_date` text,
	`expiry_date` text NOT NULL,
	`document_url` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `carrier_performance` (
	`id` text PRIMARY KEY NOT NULL,
	`carrier_id` text NOT NULL,
	`shipment_ref` text,
	`pickup_on_time` integer,
	`delivery_on_time` integer,
	`damage_reported` integer DEFAULT false,
	`claim_filed` integer DEFAULT false,
	`transit_days` integer,
	`communication_score` integer,
	`notes` text,
	`recorded_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `carrier_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`carrier_id` text NOT NULL,
	`origin_city` text,
	`origin_state` text,
	`origin_zip` text,
	`dest_city` text,
	`dest_state` text,
	`dest_zip` text,
	`equipment_type` text,
	`rate_type` text DEFAULT 'per_mile' NOT NULL,
	`rate_amount` real NOT NULL,
	`effective_date` text,
	`expiry_date` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `carriers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mc_number` text,
	`dot_number` text,
	`scac_code` text,
	`address_street` text,
	`address_city` text,
	`address_state` text,
	`address_zip` text,
	`address_country` text DEFAULT 'US',
	`website` text,
	`equipment_types` text DEFAULT '[]',
	`service_areas` text DEFAULT '[]',
	`notes` text,
	`tags` text DEFAULT '[]',
	`status` text DEFAULT 'active' NOT NULL,
	`overall_score` real,
	`authority_status` text DEFAULT 'unknown',
	`safety_rating` text DEFAULT 'unknown',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
