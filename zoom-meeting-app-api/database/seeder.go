package database

import (
	"fmt"
	"zoom-meeting-app/models"

	"golang.org/x/crypto/bcrypt"
)

// SeedDatabase mengisi database dengan data awal
func SeedDatabase() {
	// Cek apakah sudah ada data user, kalau belum tambahkan
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

		users := []models.User{
			{Name: "Admin", Email: "admin@local.com", Password: string(hashedPassword)},
			{Name: "User", Email: "user@local.com", Password: string(hashedPassword)},
		}

		DB.Create(&users)
		fmt.Println("User seeding completed!")
	}
}
