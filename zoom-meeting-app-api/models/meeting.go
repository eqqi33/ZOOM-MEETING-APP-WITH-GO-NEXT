package models

import "gorm.io/gorm"

type Meeting struct {
	gorm.Model
	ZoomID    string `json:"zoom_id"`
	Topic     string `json:"topic"`
	StartTime string `json:"start_time"`
	JoinURL   string `json:"join_url"`
	UserID    uint   `json:"user_id"`
	User      User   `json:"user" gorm:"foreignKey:UserID"`
}
