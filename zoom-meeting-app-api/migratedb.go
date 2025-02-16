package main

import "zoom-meeting-app/database"

func RunMigration() {
	database.ConnectDatabase()
	database.MigrateDatabase()
}