package database

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"zoom-meeting-app/models"
)

var DB *gorm.DB

func ConnectDatabase() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	DB = database
	fmt.Println("Database connected!")
}

func MigrateDatabase() {
	err := DB.AutoMigrate(&models.User{}, &models.Meeting{}) // Tambahkan model lainnya
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	fmt.Println("Database migrated!")
}

// ResetDatabase akan menghapus semua tabel, migrasi ulang, dan menjalankan seeder
func ResetDatabase() {
	fmt.Println("Resetting database...")

	// Hapus semua tabel
	err := DB.Migrator().DropTable(&models.User{}, &models.Meeting{}) // Tambahkan model lain jika ada
	if err != nil {
		log.Fatal("Failed to drop tables:", err)
	}

	fmt.Println("All tables dropped!")

	// Migrasi ulang
	MigrateDatabase()
	fmt.Println("Database migrated!")

	// Jalankan seeder
	SeedDatabase()
	fmt.Println("Database seeded!")
}