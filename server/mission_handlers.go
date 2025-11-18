package server

import (
	"backend-avanzada/api"
	"backend-avanzada/models"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func (s *Server) HandleMissions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		list, err := s.MissionRepository.FindAll()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		resp := []*api.MissionResponseDto{}
		for _, m := range list {
			resp = append(resp, m.ToResponseDto())
		}
		json.NewEncoder(w).Encode(resp)
		return

	case http.MethodPost:
		var req api.MissionRequestDto
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		var assigned *uint
		assignedInput := req.AsignadoAID
		if assignedInput == nil {
			assignedInput = req.LegacyAsignadoAID
		}
		if assignedInput != nil {
			v := uint(*assignedInput)
			assigned = &v
		}
		status := "PENDING"
		if req.Estado != nil && *req.Estado != "" {
			status = *req.Estado
		}
		m := &models.Mission{Title: req.Titulo, Description: req.Descripcion, Status: status, AssignedToID: assigned}
		if _, err := s.MissionRepository.Save(m); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(m.ToResponseDto())
		return
	}
}

func (s *Server) HandleMissionsWithId(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	switch r.Method {
	case http.MethodGet:
		m, err := s.MissionRepository.FindById(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if m == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(m.ToResponseDto())
		return

	case http.MethodPut:
		m, err := s.MissionRepository.FindById(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if m == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		var req api.MissionRequestDto
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		m.Title = req.Titulo
		m.Description = req.Descripcion
		if req.Estado != nil && *req.Estado != "" {
			m.Status = *req.Estado
		}
		assignedInput := req.AsignadoAID
		if assignedInput == nil {
			assignedInput = req.LegacyAsignadoAID
		}
		if assignedInput != nil {
			v := uint(*assignedInput)
			m.AssignedToID = &v
		} else {
			m.AssignedToID = nil
		}
		if _, err := s.MissionRepository.Save(m); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(m.ToResponseDto())
		return

	case http.MethodDelete:
		m, err := s.MissionRepository.FindById(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if m == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if err := s.MissionRepository.Delete(m); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return
	}
}
