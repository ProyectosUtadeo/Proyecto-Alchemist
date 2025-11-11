package config

type Config struct {
	Address                     string `json:"address"`
	Database                    string `json:"database"`
	KillDuration                int    `json:"kill_duration"`
	KillDurationWithDescription int    `json:"kill_duration_with_desc"`

	// Para transmutaciones (segundos)
	TransmutationDuration     int `json:"transmutation_duration"`
	TransmutationDurationHigh int `json:"transmutation_duration_high"`

	DailyCheckHour            string  `json:"daily_check_hour"`
	MaterialLowStockThreshold float64 `json:"material_low_stock_threshold"`
	MissionStaleDays          int     `json:"mission_stale_days"`
}
