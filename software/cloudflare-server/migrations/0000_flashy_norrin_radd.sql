CREATE TABLE `SensorReadings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`temperature` real,
	`humidity` real,
	`co2` real,
	`o2` real,
	`ph` real,
	`pressure` real,
	`moisture` real,
	`ir` real,
	`conductivity` real,
	`imageUrl` text
);
