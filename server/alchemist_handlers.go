package server

import (
	"backend-avanzada/api"
	"backend-avanzada/models"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

func (s *Server) HandleAlchemists(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		start := time.Now()
		list, err := s.AlchemistRepository.FindAll()
		if err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}

		resp := make([]*api.AlchemistResponseDto, 0, len(list))
		for _, a := range list {
			resp = append(resp, a.ToResponseDto())
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}
		s.logger.Info(http.StatusOK, r.URL.Path, start)
		return

	case http.MethodPost:
		// Crear
		var req api.AlchemistRequestDto
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Normalizar email: si viene vacío o solo espacios => NULL (nil)
		var emailPtr *string
		if e := strings.TrimSpace(req.Email); e != "" {
			emailPtr = &e
		}

		a := &models.Alchemist{
			Name:      strings.TrimSpace(req.Nombre),
			Specialty: strings.TrimSpace(req.Especialidad),
			Rank:      strings.TrimSpace(req.Rango),
			Age:       int(req.Edad),
			Email:     emailPtr,
		}

		if _, err := s.AlchemistRepository.Save(a); err != nil {
			// por ejemplo violación de unique index
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(a.ToResponseDto())
		return

	default:
		// Método no permitido en esta ruta
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
}

func (s *Server) HandleAlchemistsWithId(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	switch r.Method {
	case http.MethodGet:
		a, err := s.AlchemistRepository.FindById(id)
		if err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}
		if a == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(a.ToResponseDto())
		return

	case http.MethodPut:
		a, err := s.AlchemistRepository.FindById(id)
		if err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}
		if a == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		var req api.AlchemistRequestDto
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Normalizar email
		var emailPtr *string
		if e := strings.TrimSpace(req.Email); e != "" {
			emailPtr = &e
		}

		a.Name = strings.TrimSpace(req.Nombre)
		a.Specialty = strings.TrimSpace(req.Especialidad)
		a.Rank = strings.TrimSpace(req.Rango)
		a.Age = int(req.Edad)
		a.Email = emailPtr

		if _, err := s.AlchemistRepository.Save(a); err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(a.ToResponseDto())
		return

	case http.MethodDelete:
		a, err := s.AlchemistRepository.FindById(id)
		if err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}
		if a == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if err := s.AlchemistRepository.Delete(a); err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
}
