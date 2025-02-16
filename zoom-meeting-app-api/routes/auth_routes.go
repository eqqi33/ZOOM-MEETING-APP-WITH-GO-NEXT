package routes

import (
	"zoom-meeting-app/controllers"
	"zoom-meeting-app/middleware"

	"github.com/gin-gonic/gin"
)

func AuthRoutes(r *gin.Engine) {
	auth := r.Group("/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
		auth.GET("/zoom", middleware.AuthMiddleware(), controllers.RedirectToZoom)
		auth.GET("/callback", controllers.ZoomCallback)
		auth.GET("/me", middleware.AuthMiddleware(), controllers.Me)
	}
}
