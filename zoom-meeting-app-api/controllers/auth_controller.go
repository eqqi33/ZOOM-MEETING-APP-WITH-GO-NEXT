package controllers

import (
	"fmt"
	"net/http"
	"os"
	"time"
	"zoom-meeting-app/database"
	"zoom-meeting-app/models"
	"zoom-meeting-app/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)

	user := models.User{Name: input.Name, Email: input.Email, Password: string(hashedPassword)}
	database.DB.Create(&user)

	c.JSON(http.StatusOK, gin.H{"message": "User registered"})
}

func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, _ := utils.GenerateToken(user.ID)
	// Store valid token in a secure HTTP cookie
	c.SetCookie("accessToken", token, 3600, "/", "localhost", false, true)
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"accessToken": token,
		},
	})

}

// RedirectToZoom handles the Zoom OAuth redirection
func RedirectToZoom(c *gin.Context) {
	zoomClientID := os.Getenv("ZOOM_CLIENT_ID")
	zoomClientSecret := os.Getenv("ZOOM_CLIENT_SECRET") // Needed for refreshing tokens
	redirectFrontend := os.Getenv("REDIRECT_FRONTEND")
	redirectURI := "http://localhost:8000/auth/callback" // Backend callback URL

	// Retrieve user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Type assertion
	currentUser, ok := user.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User type assertion failed"})
		return
	}

	// Check if user has a Zoom token
	if currentUser.ZoomToken != "" {
		// Verify if the Zoom token is still valid
		if utils.IsValidZoomToken(currentUser.ZoomToken) {
			c.Redirect(http.StatusFound, redirectFrontend)
			return
		}

		// If token is invalid, try refreshing it
		newToken, newRefreshToken, err := utils.RefreshZoomToken(currentUser.ZoomRefresh, zoomClientID, zoomClientSecret)
		if err == nil {
			// Update user with new tokens
			currentUser.ZoomToken = newToken
			currentUser.ZoomRefresh = newRefreshToken
			database.DB.Save(&currentUser) // Save updated tokens to DB

			c.Redirect(http.StatusFound, redirectFrontend)
			return
		}
	}
	// If refresh fails or user has no token, force re-authentication with Zoom
	authURL := fmt.Sprintf(
		"https://zoom.us/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s",
		zoomClientID, redirectURI,
	)
	c.Redirect(http.StatusFound, authURL)
}

func ZoomCallback(c *gin.Context) {
	code := c.Query("code") // Get the authorization code from Zoom

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
		return
	}

	// Exchange the code for an access token
	tokenResponse, err := utils.ExchangeCodeForToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange code"})
		return
	}

	cookieToken, err := c.Cookie("accessToken")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		c.Abort()
		return
	}

	// Validate the token
	claims, err := utils.ValidateToken(cookieToken)
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

	// Fetch Zoom profile to get the email
	zoomProfile, err := utils.GetZoomProfile(c, tokenResponse.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch Zoom profile"})
		return
	}
	if user.IdZoom != "" && user.IdZoom != zoomProfile.Id {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed connect to zoom, account zoom did not match with existing account apps, please use the first integrated same zoom account with your account apps"})
		return
	}
	// Update user with new Zoom tokens
	database.DB.Model(&user).Updates(map[string]interface{}{
		"zoom_token":   tokenResponse.AccessToken,
		"zoom_refresh": tokenResponse.RefreshToken,
		"zoom_expires": time.Now().Add(time.Duration(tokenResponse.ExpiresIn) * time.Second),
		"id_zoom":      zoomProfile.Id,
	})

	redirectFrontend := os.Getenv("REDIRECT_FRONTEND")
	c.Redirect(http.StatusFound, redirectFrontend)
}

func Me(c *gin.Context) {
	user, _ := c.Get("user")
	c.JSON(http.StatusOK, user)
}
