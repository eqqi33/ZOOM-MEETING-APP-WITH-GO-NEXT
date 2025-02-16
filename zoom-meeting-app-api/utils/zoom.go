package utils

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
	"zoom-meeting-app/database"
	"zoom-meeting-app/models"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

const zoomAPI = "https://api.zoom.us/v2"

var (
	mu sync.Mutex
)

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

type ZoomProfile struct {
	Id    string `json:"id"`
	Email string `json:"email"`
}

func GetZoomProfile(c *gin.Context, token string) (*ZoomProfile, error) {
	// Define Zoom API URL
	url := "https://api.zoom.us/v2/users/me"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	// Set authorization header
	req.Header.Set("Authorization", "Bearer "+token)

	// Make the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Parse the response body
	var profile ZoomProfile
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return nil, err
	}

	return &profile, nil
}

func ExchangeCodeForToken(code string) (*TokenResponse, error) {
	clientID := os.Getenv("ZOOM_CLIENT_ID")
	clientSecret := os.Getenv("ZOOM_CLIENT_SECRET")
	redirectURI := "http://localhost:8000/auth/callback" // Backend URL

	url := "https://zoom.us/oauth/token"

	reqBody := fmt.Sprintf("grant_type=authorization_code&code=%s&redirect_uri=%s", code, redirectURI)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(reqBody)))
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(clientID, clientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var tokenResponse TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
		return nil, err
	}

	return &tokenResponse, nil
}

// GetZoomAccessToken fetches and caches the Zoom API access token for a specific user
func GetZoomAccessToken(userID int) (string, error) {
	mu.Lock()
	defer mu.Unlock()

	// Load environment variables from .env file
	_ = godotenv.Load()

	// Fetch user from the database
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return "", fmt.Errorf("user not found")
	}

	// Check if the user has stored Zoom credentials
	if user.ZoomToken != "" && time.Now().Before(user.ZoomExpires) {
		fmt.Println("✅ Using cached access token for user:", user.Email)
		return user.ZoomToken, nil
	}

	clientID := os.Getenv("ZOOM_CLIENT_ID")
	clientSecret := os.Getenv("ZOOM_CLIENT_SECRET")

	if clientID == "" || clientSecret == "" {
		return "", fmt.Errorf("missing Zoom API credentials. Please check your environment variables")
	}

	// Encode credentials to Base64
	authHeader := base64.StdEncoding.EncodeToString([]byte(clientID + ":" + clientSecret))

	// Make HTTP request
	req, err := http.NewRequest("POST", "https://zoom.us/oauth/token?grant_type=refresh_token&refresh_token="+user.ZoomRefresh, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Basic "+authHeader)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Read response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// Parse JSON response
	var result struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int    `json:"expires_in"`
		AccountID    string `json:"account_id"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	// Update user in database
	user.ZoomToken = result.AccessToken
	user.ZoomRefresh = result.RefreshToken
	user.ZoomExpires = time.Now().Add(time.Duration(result.ExpiresIn) * time.Second)
	user.ZoomAccount = result.AccountID

	if err := database.DB.Save(&user).Error; err != nil {
		return "", fmt.Errorf("failed to update user with Zoom credentials")
	}

	fmt.Println("✅ Updated Zoom token for user:", user.Email)

	return user.ZoomToken, nil
}

func IsValidZoomToken(token string) bool {
	client := &http.Client{}
	req, _ := http.NewRequest("GET", "https://api.zoom.us/v2/users/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	// Token is valid if response is 200 OK
	return resp.StatusCode == http.StatusOK
}

func RefreshZoomToken(refreshToken, clientID, clientSecret string) (string, string, error) {
	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", refreshToken)

	req, _ := http.NewRequest("POST", "https://zoom.us/oauth/token", strings.NewReader(data.Encode()))
	req.SetBasicAuth(clientID, clientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("failed to refresh token, status: %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	newToken, _ := result["access_token"].(string)
	newRefreshToken, _ := result["refresh_token"].(string)

	return newToken, newRefreshToken, nil
}

// CheckProfileEmail compares the email in the Zoom profile with the email in the database
func CheckProfileEmail(c *gin.Context, userEmail string, zoomEmail string) bool {
	// Retrieve the user from the context (assuming user is authenticated)
	// Fetch the user from the database to compare emails
	var dbUser models.User
	if err := database.DB.First(&dbUser, "email = ?", userEmail).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return false
	}

	// Compare the emails
	if zoomEmail != dbUser.Email {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email mismatch between Zoom profile and User Apps, please use same email for meeting"})
		return false
	}

	return true
}

// Get a single Zoom meeting by ID
func GetZoomMeetingByID(c *gin.Context, meetingID string) (map[string]interface{}, error) {
	// Get user from session
	userInterface, exists := c.Get("user")
	if !exists {
		return nil, fmt.Errorf("unauthorized: user session not found")
	}

	user, ok := userInterface.(models.User)
	if !ok {
		return nil, fmt.Errorf("invalid user session data")
	}
	accessToken, err := GetZoomAccessToken(int(user.ID))
	if err != nil {
		return nil, fmt.Errorf("failed to get Zoom access token: %v", err)
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/meetings/%s", zoomAPI, meetingID), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("zoom API error: %v", string(body))
	}

	return result, nil
}

// Get Zoom Meeting
func GetZoomMeetings(c *gin.Context) ([]map[string]interface{}, error) {
	// Get user from session
	userInterface, exists := c.Get("user")
	if !exists {
		return nil, fmt.Errorf("unauthorized: user session not found")
	}

	user, ok := userInterface.(models.User)
	if !ok {
		return nil, fmt.Errorf("invalid user session data")
	}
	accessToken, err := GetZoomAccessToken(int(user.ID))
	if err != nil {
		return nil, fmt.Errorf("failed to get Zoom access token: %v", err)
	}

	req, err := http.NewRequest("GET", zoomAPI+"/users/me/meetings?page_size=300", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("zoom API error: %v", string(body))
	}

	meetings, ok := result["meetings"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid response format")
	}

	var zoomMeetings []map[string]interface{}
	for _, m := range meetings {
		zoomMeetings = append(zoomMeetings, m.(map[string]interface{}))
	}

	return zoomMeetings, nil
}

// CreateZoomMeeting creates a Zoom meeting using OAuth access token
func CreateZoomMeeting(c *gin.Context, topic string, startTime string) (map[string]interface{}, error) {
	// Get OAuth access token
	// Get user from session
	userInterface, exists := c.Get("user")
	if !exists {
		return nil, fmt.Errorf("unauthorized: user session not found")
	}

	user, ok := userInterface.(models.User)
	if !ok {
		return nil, fmt.Errorf("invalid user session data")
	}
	accessToken, err := GetZoomAccessToken(int(user.ID))
	if err != nil {
		return nil, fmt.Errorf("failed to get Zoom access token: %v", err)
	}

	startTimeUTC, _ := time.Parse(time.RFC3339, startTime)

	// Subtract 7 hours to match Jakarta time manually
	startTimeFinal := startTimeUTC.Add(-7 * time.Hour).Format(time.RFC3339)

	// Request payload
	data := map[string]interface{}{
		"topic":      topic,
		"type":       2,
		"start_time": startTimeFinal, // Send Jakarta time
		"duration":   30,
		"timezone":   "Asia/Jakarta", // Ensure Zoom treats it as Jakarta time
	}

	// Convert to JSON
	jsonData, _ := json.Marshal(data)

	// Make HTTP request
	req, err := http.NewRequest("POST", zoomAPI+"/users/me/meetings", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	// Set OAuth token in Authorization header
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Read response
	body, _ := ioutil.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	// Handle API errors
	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("zoom API error: %v", string(body))
	}

	return result, nil
}

// Update Zoom Meeting
func UpdateZoomMeeting(c *gin.Context, meetingID string, topic string, startTime string) (map[string]interface{}, error) {
	// Get user from session
	userInterface, exists := c.Get("user")
	if !exists {
		return nil, fmt.Errorf("unauthorized: user session not found")
	}

	user, ok := userInterface.(models.User)
	if !ok {
		return nil, fmt.Errorf("invalid user session data")
	}
	accessToken, err := GetZoomAccessToken(int(user.ID))
	if err != nil {
		return nil, fmt.Errorf("failed to get Zoom access token: %v", err)
	}

	startTimeUTC, _ := time.Parse(time.RFC3339, startTime)

	// Subtract 7 hours to match Jakarta time manually
	startTimeFinal := startTimeUTC.Add(-7 * time.Hour).Format(time.RFC3339)

	// Request payload
	data := map[string]interface{}{
		"topic":      topic,
		"type":       2,
		"start_time": startTimeFinal, // Send Jakarta time
		"duration":   30,
		"timezone":   "Asia/Jakarta", // Ensure Zoom treats it as Jakarta time
	}

	jsonData, _ := json.Marshal(data)

	req, err := http.NewRequest("PATCH", fmt.Sprintf("%s/meetings/%s", zoomAPI, meetingID), bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if resp.StatusCode != http.StatusNoContent {
		return nil, fmt.Errorf("zoom API error: %v", string(body))
	}

	return result, nil
}

// Delete Zoom Meeting
func DeleteZoomMeeting(c *gin.Context, meetingID string) error {
	// Get user from session
	userInterface, exists := c.Get("user")
	if !exists {
		return fmt.Errorf("unauthorized: user session not found")
	}

	user, ok := userInterface.(models.User)
	if !ok {
		return fmt.Errorf("invalid user session data")
	}
	accessToken, err := GetZoomAccessToken(int(user.ID))
	if err != nil {
		return fmt.Errorf("failed to get Zoom access token: %v", err)
	}

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/meetings/%s", zoomAPI, meetingID), nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("zoom API error: %v", string(body))
	}

	return nil
}
