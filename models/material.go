package models

import (
	"backend-avanzada/api"

	"gorm.io/gorm"
)

type Material struct {
	gorm.Model
	Name  string
	Unit  string
	Cost  float64
	Stock float64
}

func (m *Material) ToResponseDto() *api.MaterialResponseDto {
	return &api.MaterialResponseDto{
		ID:     int(m.ID),
		Nombre: m.Name,
		Unidad: m.Unit,
		Costo:  m.Cost,
		Stock:  m.Stock,
	}
}
