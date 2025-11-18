package api

type AuditResponseDto struct {
	ID          int    `json:"audit_id"`
	Accion      string `json:"action"`
	Entidad     string `json:"entity"`
	EntidadID   int    `json:"entity_id"`
	Descripcion string `json:"description"`
	Fecha       string `json:"created_at"`
}
