package api

type MissionRequestDto struct {
	Titulo            string  `json:"title"`
	Descripcion       string  `json:"description"`
	Estado            *string `json:"status,omitempty"`
	AsignadoAID       *int    `json:"assigned_to"`
	LegacyAsignadoAID *int    `json:"assigned_to_id"`
}

type MissionResponseDto struct {
	ID                int    `json:"id"`
	Titulo            string `json:"title"`
	Descripcion       string `json:"description"`
	Estado            string `json:"status"`
	AsignadoAID       *int   `json:"assigned_to,omitempty"`
	LegacyAsignadoAID *int   `json:"assigned_to_id,omitempty"`
	CreadoEn          string `json:"created_at,omitempty"`
}
