package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Email        string `gorm:"uniqueIndex"`
	PasswordHash string
	Role         string // "ALCHEMIST" o "SUPERVISOR"
	AlchemistID  *uint  // opcional: link a un Alchemist
}
