package server

import (
	"backend-avanzada/models"
	"encoding/json"
	"net/http"
	"strings"
)

type registerReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`         // "ALCHEMIST" | "SUPERVISOR"
	AlcID    *uint  `json:"alchemist_id"` // opcional
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResp struct {
	Token string `json:"token"`
}

func (s *Server) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	email := strings.TrimSpace(req.Email)
	role := strings.ToUpper(strings.TrimSpace(req.Role))
	if email == "" || req.Password == "" || (role != "ALCHEMIST" && role != "SUPERVISOR") {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	exists, _ := s.UserRepository.FindByEmail(email)
	if exists != nil {
		http.Error(w, "email already registered", http.StatusConflict)
		return
	}
	hash, err := hashPassword(req.Password)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	user := &models.User{
		Email:        email,
		PasswordHash: hash,
		Role:         role,
		AlchemistID:  req.AlcID,
	}
	if _, err := s.UserRepository.Save(user); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	token, err := generateToken(user.ID, user.Email, user.Role, 24) // 24h
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(authResp{Token: token})
}

func (s *Server) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	email := strings.TrimSpace(req.Email)
	if email == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	user, err := s.UserRepository.FindByEmail(email)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	if err := checkPasswordHash(user.PasswordHash, req.Password); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	token, err := generateToken(user.ID, user.Email, user.Role, 24)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(authResp{Token: token})
}
