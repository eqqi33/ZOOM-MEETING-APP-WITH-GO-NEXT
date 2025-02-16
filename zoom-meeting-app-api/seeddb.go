package main

import "zoom-meeting-app/database"

func RunsSeed() {
	database.ConnectDatabase()
	database.SeedDatabase()
}
