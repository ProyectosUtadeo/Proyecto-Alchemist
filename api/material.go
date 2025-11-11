package api

type MaterialRequestDto struct {
	Nombre string  `json:"name"`
	Unidad string  `json:"unit"`
	Costo  float64 `json:"cost"`
	Stock  float64 `json:"stock"`
}

type MaterialResponseDto struct {
	ID     int     `json:"material_id"`
	Nombre string  `json:"name"`
	Unidad string  `json:"unit"`
	Costo  float64 `json:"cost"`
	Stock  float64 `json:"stock"`
}
