package models

import (
	"backend-avanzada/api"
	"time"

	"gorm.io/gorm"
)

type Transmutation struct {
	gorm.Model
	Description            string
	Status                 string
	AlchemistID            uint
	Alchemist              *Alchemist
	EstimatedCost          float64
	EstimatedDurationTotal int
}

func (t *Transmutation) ToResponseDto(includeAlchemist bool) *api.TransmutationResponseDto {
	dto := &api.TransmutationResponseDto{
		ID:                     int(t.ID),
		AlchemistID:            int(t.AlchemistID),
		Description:            t.Description,
		Status:                 t.Status,
		CreatedAt:              t.CreatedAt.Format(time.RFC3339),
		EstimatedCost:          t.EstimatedCost,
		EstimatedDurationTotal: t.EstimatedDurationTotal,
	}
	if includeAlchemist && t.Alchemist != nil {
		dto.Alchemist = t.Alchemist.ToResponseDto()
	}
	return dto
}
