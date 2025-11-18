package models

import (
	"backend-avanzada/api"

	"gorm.io/gorm"
)

type Alchemist struct {
	gorm.Model
	Name      string  // nombre visible como "Nombre"
	Age       int     // visible como "Edad"
	Email     *string // puntero para permitir NULL y no romper el índice único
	Specialty string  // visible como "Especialidad"
	Rank      string  // visible como "Rango"
}

func (a *Alchemist) ToResponseDto() *api.AlchemistResponseDto {
	email := ""
	if a.Email != nil {
		email = *a.Email
	}

	return &api.AlchemistResponseDto{
		ID:            int(a.ID),
		LegacyID:      int(a.ID),
		Nombre:        a.Name,
		Edad:          a.Age,
		Email:         email,
		Especialidad:  a.Specialty,
		Rango:         a.Rank,
		FechaCreacion: a.CreatedAt.String(),
	}
}
