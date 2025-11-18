package server

import (
	"net/http"

	"github.com/gorilla/mux"
)

func (s *Server) router() http.Handler {
	router := mux.NewRouter()
	router.Use(s.logger.RequestLogger)

	//  Rutas públicas de autenticación (JWT)
	router.HandleFunc("/auth/register", s.HandleRegister).Methods(http.MethodPost)
	router.HandleFunc("/auth/login", s.HandleLogin).Methods(http.MethodPost)

	// RUTAS (Amestris)
	router.HandleFunc("/alchemists", s.HandleAlchemists).Methods(http.MethodGet, http.MethodPost)
	router.HandleFunc("/alchemists/{id}", s.HandleAlchemistsWithId).Methods(http.MethodGet, http.MethodPut, http.MethodDelete)

	router.HandleFunc("/materials", s.HandleMaterials).Methods(http.MethodGet, http.MethodPost)
	router.HandleFunc("/materials/{id}", s.HandleMaterialsWithId).Methods(http.MethodGet, http.MethodPut, http.MethodDelete)

	router.HandleFunc("/missions", s.HandleMissions).Methods(http.MethodGet, http.MethodPost)
	router.HandleFunc("/missions/{id}", s.HandleMissionsWithId).Methods(http.MethodGet, http.MethodPut, http.MethodDelete)

	router.HandleFunc("/transmutations", s.HandleTransmutations).Methods(http.MethodGet, http.MethodPost)
	router.HandleFunc("/transmutations/simulate", s.HandleTransmutationSimulation).Methods(http.MethodPost)
	router.HandleFunc("/transmutations/{id}", s.HandleTransmutationsWithId).Methods(http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodDelete)

	router.HandleFunc("/audits", s.HandleAudits).Methods(http.MethodGet)

	router.HandleFunc("/ws", s.HandleWS).Methods(http.MethodGet)

	return router
}
