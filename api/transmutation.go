package api

type TransmutationSimulationMaterialDto struct {
	MaterialID int     `json:"material_id"`
	Quantity   float64 `json:"quantity"`
}

type TransmutationRequestDto struct {
	Description     string                               `json:"description"`
	Status          string                               `json:"status,omitempty"`
	AlchemistID     *int                                 `json:"alchemist_id,omitempty"`
	Complexity      string                               `json:"complexity,omitempty"`
	RiskLevel       string                               `json:"risk_level,omitempty"`
	CatalystQuality *int                                 `json:"catalyst_quality,omitempty"`
	Materials       []TransmutationSimulationMaterialDto `json:"materials,omitempty"`
}

type TransmutationResponseDto struct {
	ID                     int                   `json:"id"`
	AlchemistID            int                   `json:"alchemist_id"`
	Description            string                `json:"description"`
	Status                 string                `json:"status"`
	CreatedAt              string                `json:"created_at"`
	EstimatedCost          float64               `json:"estimated_cost,omitempty"`
	EstimatedDurationTotal int                   `json:"estimated_duration_seconds,omitempty"`
	Alchemist              *AlchemistResponseDto `json:"alchemist,omitempty"`
}

type TransmutationTaskResponseDto struct {
	Alchemist *AlchemistResponseDto `json:"alchemist"`
	Status    string                `json:"status"`
}

type TransmutationSimulationRequestDto struct {
	Description     string                               `json:"description"`
	Complexity      string                               `json:"complexity,omitempty"`
	RiskLevel       string                               `json:"risk_level,omitempty"`
	CatalystQuality *int                                 `json:"catalyst_quality,omitempty"`
	Materials       []TransmutationSimulationMaterialDto `json:"materials,omitempty"`
}

type TransmutationSimulationMaterialBreakdownDto struct {
	MaterialID int     `json:"material_id"`
	Name       string  `json:"name"`
	Quantity   float64 `json:"quantity"`
	UnitCost   float64 `json:"unit_cost"`
	Subtotal   float64 `json:"subtotal"`
}

type TransmutationSimulationResponseDto struct {
	Complexity         string                                        `json:"complexity"`
	RiskLevel          string                                        `json:"risk_level"`
	CatalystQuality    int                                           `json:"catalyst_quality"`
	BaseMaterialCost   float64                                       `json:"base_material_cost"`
	ArcaneEnergyCost   float64                                       `json:"arcane_energy_cost"`
	ComplexityWeight   float64                                       `json:"complexity_weight"`
	RiskMultiplier     float64                                       `json:"risk_multiplier"`
	CatalystModifier   float64                                       `json:"catalyst_modifier"`
	EstimatedCost      float64                                       `json:"estimated_cost"`
	DurationSeconds    int                                           `json:"duration_seconds"`
	MaterialsBreakdown []TransmutationSimulationMaterialBreakdownDto `json:"materials_breakdown"`
}
