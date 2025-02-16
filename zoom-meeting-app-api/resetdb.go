package main

import "zoom-meeting-app/database"

func ResetDb() {
	database.ConnectDatabase()
	database.ResetDatabase()
}
