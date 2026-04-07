CREATE TABLE IF NOT EXISTS `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_number` text NOT NULL,
	`vin` text,
	`year` integer,
	`make` text,
	`model` text,
	`type` text,
	`license_plate` text,
	`state` text,
	`status` text DEFAULT 'active' NOT NULL,
	`current_mileage` integer DEFAULT 0 NOT NULL,
	`last_inspection_date` text,
	`next_inspection_due` text,
	`acquisition_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `vehicles_unit_number_unique` ON `vehicles` (`unit_number`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `maintenance_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`service_type` text NOT NULL,
	`interval_miles` integer,
	`interval_days` integer,
	`last_completed_at` text,
	`last_completed_miles` integer,
	`next_due_at` text,
	`next_due_miles` integer,
	`priority` text DEFAULT 'medium' NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `work_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`work_order_number` text,
	`type` text,
	`status` text DEFAULT 'open' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`assigned_to` text,
	`vendor` text,
	`parts_cost` real DEFAULT 0 NOT NULL,
	`labor_cost` real DEFAULT 0 NOT NULL,
	`total_cost` real DEFAULT 0 NOT NULL,
	`started_at` text,
	`completed_at` text,
	`mileage_at_service` integer,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `work_orders_work_order_number_unique` ON `work_orders` (`work_order_number`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dvir_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`driver_name` text NOT NULL,
	`inspection_type` text DEFAULT 'pre_trip' NOT NULL,
	`date` text NOT NULL,
	`mileage` integer,
	`defects_found` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'no_defects' NOT NULL,
	`defects_json` text,
	`corrective_action` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `parts_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`part_number` text,
	`name` text NOT NULL,
	`category` text,
	`quantity_on_hand` integer DEFAULT 0 NOT NULL,
	`minimum_stock` integer DEFAULT 0 NOT NULL,
	`unit_cost` real DEFAULT 0 NOT NULL,
	`supplier` text,
	`location` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
