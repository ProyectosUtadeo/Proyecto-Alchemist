package server

import (
	"backend-avanzada/api"
	"backend-avanzada/models"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func (s *Server) HandleMaterials(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		list, err := s.MaterialRepository.FindAll()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		resp := []*api.MaterialResponseDto{}
		for _, m := range list {
			resp = append(resp, m.ToResponseDto())
		}
		json.NewEncoder(w).Encode(resp)
		return

	case http.MethodPost:
		var req api.MaterialRequestDto
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		m := &models.Material{Name: req.Nombre, Unit: req.Unidad, Cost: req.Costo, Stock: req.Stock}
		if _, err := s.MaterialRepository.Save(m); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(m.ToResponseDto())
		return
	}
}

func (s *Server) HandleMaterialsWithId(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	switch r.Method {
	case http.MethodGet:
		m, err := s.MaterialRepository.FindById(id)
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
		m, err := s.MaterialRepository.FindById(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if m == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		var req api.MaterialRequestDto
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		m.Name = req.Nombre
		m.Unit = req.Unidad
		m.Cost = req.Costo
		m.Stock = req.Stock
		if _, err := s.MaterialRepository.Save(m); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(m.ToResponseDto())
		return

	case http.MethodDelete:
		m, err := s.MaterialRepository.FindById(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if m == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if err := s.MaterialRepository.Delete(m); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return
	}
}
