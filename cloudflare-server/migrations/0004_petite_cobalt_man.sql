CREATE TABLE `Conductivity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`liquidLevel` real DEFAULT (NULL),
	`foodWasteMoisture` real DEFAULT (NULL),
	`timestamp` numeric DEFAULT (NULL)
);
