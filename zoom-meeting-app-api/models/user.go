package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name        string    `json:"name"`
	Email       string    `json:"email" gorm:"unique"`
	Password    string    `json:"-"`
	ZoomToken   string    `json:"-"`
	ZoomRefresh string    `json:"-"`
	ZoomAccount string    `json:"zoom_account"`
	ZoomExpires time.Time `json:"zoom_expires"`
	IdZoom      string    `json:"id_zoom"`
}
