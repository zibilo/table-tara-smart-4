CREATE TABLE `dish_option_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dish_id` text NOT NULL,
	`name` text NOT NULL,
	`selection_type` text NOT NULL,
	`is_required` integer DEFAULT false,
	`display_order` integer DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dish_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`option_group_id` integer NOT NULL,
	`name` text NOT NULL,
	`extra_price` real DEFAULT 0,
	`is_available` integer DEFAULT true,
	`display_order` integer DEFAULT 0,
	`created_at` text NOT NULL,
	FOREIGN KEY (`option_group_id`) REFERENCES `dish_option_groups`(`id`) ON UPDATE no action ON DELETE no action
);
