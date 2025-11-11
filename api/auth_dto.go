package api

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"` // "ALCHEMIST" | "SUPERVISOR"
	// opcional si vas a crear/ligar alchemist aquí:
	AlchemistID *int `json:"alchemist_id,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}
