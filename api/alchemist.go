package api

type AlchemistRequestDto struct {
	Nombre       string `json:"name"`
	Edad         int32  `json:"age"`
	Email        string `json:"email"`
	Especialidad string `json:"specialty"`
	Rango        string `json:"rank"`
}

type AlchemistResponseDto struct {
	ID            int    `json:"id"`
	LegacyID      int    `json:"alchemist_id,omitempty"`
	Nombre        string `json:"name"`
	Edad          int    `json:"age"`
	Email         string `json:"email"`
	Especialidad  string `json:"specialty"`
	Rango         string `json:"rank"`
	FechaCreacion string `json:"created_at"`
}
