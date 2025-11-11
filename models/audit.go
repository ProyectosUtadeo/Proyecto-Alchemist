package models

import (
	"backend-avanzada/api"

	"gorm.io/gorm"
)

type Audit struct {
	gorm.Model
	Action      string
	Entity      string
	EntityID    uint
	Description string
}

func (a *Audit) ToResponseDto() *api.AuditResponseDto {
	return &api.AuditResponseDto{
		ID:          int(a.ID),
		Accion:      a.Action,
		Entidad:     a.Entity,
		EntidadID:   int(a.EntityID),
		Descripcion: a.Description,
		Fecha:       a.CreatedAt.String(),
	}
}
