package models

import (
	"backend-avanzada/api"
	"time"

	"gorm.io/gorm"
)

type Mission struct {
	gorm.Model
	Title        string
	Description  string
	Status       string
	AssignedToID *uint
	AssignedTo   *Alchemist
}

func (m *Mission) ToResponseDto() *api.MissionResponseDto {
	var assigned *int
	if m.AssignedToID != nil {
		v := int(*m.AssignedToID)
		assigned = &v
	}
	dto := &api.MissionResponseDto{
		ID:                int(m.ID),
		Titulo:            m.Title,
		Descripcion:       m.Description,
		Estado:            m.Status,
		AsignadoAID:       assigned,
		LegacyAsignadoAID: assigned,
	}
	if !m.CreatedAt.IsZero() {
		dto.CreadoEn = m.CreatedAt.Format(time.RFC3339)
	}
	return dto
}
