package main

import (
	"zoom-meeting-app/database"
	"zoom-meeting-app/middleware"
	"zoom-meeting-app/routes"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

func main() {
	database.ConnectDatabase()
	database.MigrateDatabase()

	r := gin.Default()

	// Set up session middleware (using a cookie store)
	store := cookie.NewStore([]byte("super-secret-key"))
	r.Use(sessions.Sessions("session", store))

	// Serve static files
	r.Static("/static", "./static")

	// Load templates
	r.LoadHTMLGlob("templates/*")

	// Apply CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Setup routes
	routes.SetupRouter(r)

	// Start server
	r.Run(":8000")
}
