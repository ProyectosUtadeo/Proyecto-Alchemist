package api

type ErrorResponse struct {
	Status      int    `json:"status"`
	Message     string `json:"message"`
	Description string `json:"description"`
}
