package middleware

import (
	"net/http"
	"strings"
	"zoom-meeting-app/database"
	"zoom-meeting-app/models"
	"zoom-meeting-app/utils"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// Check Authorization header first
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, "Bearer ")
			if len(parts) == 2 {
				tokenString = parts[1]
			}
		}

		// If no token in header or query params, check cookies
		if tokenString == "" {
			cookieToken, err := c.Cookie("accessToken")
			if err == nil {
				tokenString = cookieToken
			}
		}

		// If no token in header, check query params
		if tokenString == "" {
			tokenString = c.Query("accessToken")
		}

		// If still no token, return error
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
			c.Abort()
			return
		}

		// Validate the token
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Fetch user from database
		var user models.User
		if err := database.DB.First(&user, claims.UserID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user", user)
		c.Next()
	}
}
