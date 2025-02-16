package controllers

import (
	"fmt"
	"net/http"
	"time"
	"zoom-meeting-app/database"
	"zoom-meeting-app/models"
	"zoom-meeting-app/utils"

	"github.com/gin-gonic/gin"
)

// Define a custom struct for the response without UserID and User fields
type MeetingResponse struct {
	ID        uint   `json:"ID"`
	ZoomID    string `json:"zoom_id"`
	Topic     string `json:"topic"`
	StartTime string `json:"start_time"`
	JoinURL   string `json:"join_url"`
}

// Get All Meetings (GET /meetings)
func GetMeetings(c *gin.Context) {
	// Retrieve the current authenticated user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := user.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User type assertion failed"})
		return
	}

	// Fetch meetings from Zoom API
	zoomMeetings, err := utils.GetZoomMeetings(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get all meetings from database
	var dbMeetings []models.Meeting
	database.DB.Select("ID", "zoom_id, topic, start_time, join_url").Where("user_id = ?", currentUser.ID).Find(&dbMeetings)

	// Create a map to track database meetings
	dbMeetingsMap := make(map[string]models.Meeting)
	for _, meeting := range dbMeetings {
		dbMeetingsMap[meeting.ZoomID] = meeting
	}

	// Process each Zoom meeting
	for _, zoomMeeting := range zoomMeetings {
		zoomID := fmt.Sprintf("%.0f", zoomMeeting["id"].(float64)) // Convert float64 to string

		// Parse the start_time string to time.Time
		zoomStartTime, err := time.Parse(time.RFC3339, zoomMeeting["start_time"].(string)) // Assuming start_time is in RFC3339 format
		if err != nil {
			// Handle error if time parsing fails
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid time format"})
			return
		}

		// Add 7 hours to the parsed time
		adjustedStartTime := zoomStartTime.Add(7 * time.Hour)

		// Format the adjusted time back to string
		adjustedStartTimeStr := adjustedStartTime.Format(time.RFC3339)

		if dbMeeting, exists := dbMeetingsMap[zoomID]; exists {
			// If exists, check for updates
			if dbMeeting.Topic != zoomMeeting["topic"].(string) ||
				dbMeeting.StartTime != adjustedStartTimeStr ||
				dbMeeting.JoinURL != zoomMeeting["join_url"].(string) {

				// Update existing record
				dbMeeting.Topic = zoomMeeting["topic"].(string)
				dbMeeting.StartTime = adjustedStartTimeStr
				dbMeeting.JoinURL = zoomMeeting["join_url"].(string)
				database.DB.Save(&dbMeeting)
			}
		} else {
			// If not exists, create new record
			newMeeting := models.Meeting{
				ZoomID:    zoomID,
				Topic:     zoomMeeting["topic"].(string),
				StartTime: adjustedStartTimeStr,
				JoinURL:   zoomMeeting["join_url"].(string),
				UserID:    currentUser.ID,
			}
			database.DB.Create(&newMeeting)
		}
	}
	if len(zoomMeetings) > 0 {
		// Return the latest meetings from the database
		var updatedMeetings []models.Meeting
		database.DB.Select("ID", "zoom_id, topic, start_time, join_url").Where("user_id = ?", currentUser.ID).Find(&updatedMeetings)
		// Create a new slice for the response
		var meetingResponses []MeetingResponse
		for _, meeting := range dbMeetings {
			meetingResponses = append(meetingResponses, MeetingResponse{
				ID:        meeting.ID,
				ZoomID:    meeting.ZoomID,
				Topic:     meeting.Topic,
				StartTime: meeting.StartTime,
				JoinURL:   meeting.JoinURL,
			})
		}
		c.JSON(http.StatusOK, gin.H{
			"data": meetingResponses,
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"data": nil,
		})
	}
}

// Get Meeting by ID (GET /meetings/:id)
func GetMeetingByID(c *gin.Context) {
	// Retrieve the current authenticated user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := user.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User type assertion failed"})
		return
	}

	id := c.Param("id")

	// Fetch meeting from Zoom API
	zoomMeeting, err := utils.GetZoomMeetingByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found in Zoom API"})
		return
	}
	// Parse the start_time string to time.Time
	zoomStartTime, err := time.Parse(time.RFC3339, zoomMeeting["start_time"].(string)) // Assuming start_time is in RFC3339 format
	if err != nil {
		// Handle error if time parsing fails
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid time format"})
		return
	}

	// Add 7 hours to the parsed time
	adjustedStartTime := zoomStartTime.Add(7 * time.Hour)

	// Format the adjusted time back to string
	adjustedStartTimeStr := adjustedStartTime.Format(time.RFC3339)
	// Check if meeting exists in database
	var dbMeeting models.Meeting
	if err := database.DB.Where("zoom_id = ?", id).First(&dbMeeting).Error; err != nil {
		// Create new record if not exists
		newMeeting := models.Meeting{
			ZoomID:    id,
			Topic:     zoomMeeting["topic"].(string),
			StartTime: adjustedStartTimeStr,
			JoinURL:   zoomMeeting["join_url"].(string),
			UserID:    currentUser.ID,
		}
		database.DB.Create(&newMeeting)
		c.JSON(http.StatusOK, newMeeting)
		return
	}

	// Update existing meeting
	updated := false
	if dbMeeting.Topic != zoomMeeting["topic"].(string) {
		dbMeeting.Topic = zoomMeeting["topic"].(string)
		updated = true
	}
	if dbMeeting.StartTime != adjustedStartTimeStr {
		dbMeeting.StartTime = adjustedStartTimeStr
		updated = true
	}
	if dbMeeting.JoinURL != zoomMeeting["join_url"].(string) {
		dbMeeting.JoinURL = zoomMeeting["join_url"].(string)
		updated = true
	}

	if updated {
		database.DB.Save(&dbMeeting)
	}

	c.JSON(http.StatusOK, gin.H{
		"data": dbMeeting,
	})
}

func CreateMeeting(c *gin.Context) {
	var input struct {
		Topic     string `json:"topic"`
		StartTime string `json:"start_time"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	zoomResponse, err := utils.CreateZoomMeeting(c, input.Topic, input.StartTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Safely extract Zoom ID
	idFloat, ok := zoomResponse["id"].(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid Zoom ID format"})
		return
	}
	zoomID := fmt.Sprintf("%.0f", idFloat) // Convert float64 to string

	// Safely extract Join URL
	joinURL, ok := zoomResponse["join_url"].(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid join URL format"})
		return
	}

	// Retrieve the current authenticated user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser, ok := user.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User type assertion failed"})
		return
	}

	// Create meeting and associate with the current user
	meeting := models.Meeting{
		ZoomID:    zoomID,
		Topic:     input.Topic,
		StartTime: input.StartTime,
		JoinURL:   joinURL,
		UserID:    currentUser.ID,
	}

	database.DB.Create(&meeting)
	c.JSON(http.StatusOK, gin.H{
		"data": meeting,
	})
}

func UpdateMeeting(c *gin.Context) {
	id := c.Param("id")

	// Find meeting in database
	var meeting models.Meeting
	if err := database.DB.First(&meeting, "zoom_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found"})
		return
	}

	// Parse request body
	var input struct {
		Topic     string `json:"topic"`
		StartTime string `json:"start_time"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update Zoom meeting
	_, err := utils.UpdateZoomMeeting(c, id, input.Topic, input.StartTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update meeting in database
	meeting.Topic = input.Topic
	meeting.StartTime = input.StartTime
	database.DB.Save(&meeting)

	c.JSON(http.StatusOK, meeting)
}

// Delete Meeting (DELETE /meetings/:id)
func DeleteMeeting(c *gin.Context) {
	id := c.Param("id")

	// Find in Database
	var meeting models.Meeting
	if err := database.DB.First(&meeting, "zoom_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found"})
		return
	}

	// Delete from Zoom
	if err := utils.DeleteZoomMeeting(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Delete from Database
	database.DB.Delete(&meeting)
	c.JSON(http.StatusOK, gin.H{"message": "Meeting deleted"})
}
