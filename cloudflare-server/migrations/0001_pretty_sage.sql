CREATE TABLE `ImageTable` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`imageUrl` text,
	`timestamp` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
