package routes

import (
	"zoom-meeting-app/controllers"
	"zoom-meeting-app/middleware"

	"github.com/gin-gonic/gin"
)

func MeetingRoutes(r *gin.Engine) {
	meetingRoutes := r.Group("/meetings")
	{
		meetingRoutes.POST("/", middleware.AuthMiddleware(), controllers.CreateMeeting)
		meetingRoutes.GET("/", middleware.AuthMiddleware(), controllers.GetMeetings)
		meetingRoutes.GET("/:id", middleware.AuthMiddleware(), controllers.GetMeetingByID)
		meetingRoutes.PUT("/:id", middleware.AuthMiddleware(), controllers.UpdateMeeting)
		meetingRoutes.DELETE("/:id", middleware.AuthMiddleware(), controllers.DeleteMeeting)
	}
}
