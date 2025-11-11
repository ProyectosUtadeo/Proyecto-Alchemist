package server

import (
	"encoding/json"
	"net/http"
)

func (s *Server) HandleAudits(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	list, err := s.AuditRepository.FindAll()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	resp := []interface{}{}
	for _, a := range list {
		resp = append(resp, a.ToResponseDto())
	}
	json.NewEncoder(w).Encode(resp)
}
