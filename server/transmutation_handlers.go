package server

import (
	"backend-avanzada/api"
	"backend-avanzada/models"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gorilla/mux"
)

const (
	auditEntityTransmutation           = "transmutation"
	defaultComplexityKey               = "LOW"
	defaultRiskKey                     = "GUARDED"
	defaultCatalystQuality             = 3
	minCatalystQuality                 = 1
	maxCatalystQuality                 = 5
	transmutationStatusPendingApproval = "PENDING_APPROVAL"
	transmutationStatusInProgress      = "IN_PROGRESS"
	transmutationStatusCompleted       = "COMPLETED"
	transmutationStatusFailed          = "FAILED"
	transmutationStatusCancelled       = "CANCELLED"
)

var (
	errTransmutationInProgress = errors.New("transmutation already running for this alchemist")
	errAlchemistNotFound       = errors.New("alchemist not found")
	errInvalidComplexityLevel  = errors.New("invalid complexity level")
	errInvalidRiskLevel        = errors.New("invalid risk level")
	errMaterialNotFound        = errors.New("material not found")
	errInvalidMaterialQuantity = errors.New("material quantity must be positive")

	allowedTransmutationStatuses = map[string]bool{
		transmutationStatusPendingApproval: true,
		transmutationStatusInProgress:      true,
		transmutationStatusCompleted:       true,
		transmutationStatusFailed:          true,
		transmutationStatusCancelled:       true,
	}

	complexityWeights = map[string]float64{
		"TRIVIAL": 0.8,
		"LOW":     1.0,
		"MEDIUM":  1.35,
		"HIGH":    1.75,
		"MASTER":  2.15,
	}

	riskMultipliers = map[string]float64{
		"LOW":      1.0,
		"GUARDED":  1.12,
		"MEDIUM":   1.25,
		"HIGH":     1.55,
		"CRITICAL": 1.9,
	}
)

func (s *Server) HandleTransmutations(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.handleGetAllTransmutations(w, r)
	case http.MethodPost:
		s.handleCreateTransmutation(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) HandleTransmutationSimulation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	s.handleSimulateTransmutationCost(w, r)
}

func (s *Server) HandleTransmutationsWithId(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.handleGetTransmutationByID(w, r)
	case http.MethodPost:
		s.handleStartTransmutation(w, r)
	case http.MethodPatch:
		s.handleUpdateTransmutationStatus(w, r)
	case http.MethodDelete:
		s.handleCancelTransmutation(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleGetAllTransmutations(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	items, err := s.TransmutationRepository.FindAll()
	if err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	result := make([]*api.TransmutationResponseDto, 0, len(items))
	for _, t := range items {
		result = append(result, t.ToResponseDto(true))
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	s.logger.Info(http.StatusOK, r.URL.Path, start)
}

func (s *Server) handleCreateTransmutation(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	var req api.TransmutationRequestDto
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, err)
		return
	}
	if req.AlchemistID == nil {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, fmt.Errorf("alchemist_id is required"))
		return
	}
	s.respondStartTransmutation(w, r, *req.AlchemistID, &req, start)
}

func (s *Server) handleSimulateTransmutationCost(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	var req api.TransmutationSimulationRequestDto
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, err)
		return
	}
	sim, err := s.calculateTransmutationSimulation(&req)
	if err != nil {
		status := http.StatusInternalServerError
		switch {
		case errors.Is(err, errInvalidComplexityLevel), errors.Is(err, errInvalidRiskLevel), errors.Is(err, errInvalidMaterialQuantity):
			status = http.StatusBadRequest
		case errors.Is(err, errMaterialNotFound):
			status = http.StatusNotFound
		}
		s.HandleError(w, status, r.URL.Path, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(sim); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	s.logger.Info(http.StatusOK, r.URL.Path, start)
}

func (s *Server) handleStartTransmutation(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	idStr := strings.TrimSpace(mux.Vars(r)["id"])
	if idStr == "" {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, fmt.Errorf("missing alchemist id in path"))
		return
	}
	alchemistID, err := strconv.Atoi(idStr)
	if err != nil {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, err)
		return
	}
	var req api.TransmutationRequestDto
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, err)
		return
	}
	if req.AlchemistID != nil && *req.AlchemistID != alchemistID {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, fmt.Errorf("body alchemist_id does not match path id"))
		return
	}
	s.respondStartTransmutation(w, r, alchemistID, &req, start)
}

func (s *Server) respondStartTransmutation(w http.ResponseWriter, r *http.Request, alchemistID int, req *api.TransmutationRequestDto, start time.Time) {
	t, err := s.startTransmutation(alchemistID, req)
	if err != nil {
		switch {
		case errors.Is(err, errAlchemistNotFound):
			s.HandleError(w, http.StatusNotFound, r.URL.Path, err)
		case errors.Is(err, errTransmutationInProgress):
			s.HandleError(w, http.StatusConflict, r.URL.Path, err)
		case errors.Is(err, errInvalidComplexityLevel), errors.Is(err, errInvalidRiskLevel), errors.Is(err, errInvalidMaterialQuantity):
			s.HandleError(w, http.StatusBadRequest, r.URL.Path, err)
		case errors.Is(err, errMaterialNotFound):
			s.HandleError(w, http.StatusNotFound, r.URL.Path, err)
		default:
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		}
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	if err := json.NewEncoder(w).Encode(t.ToResponseDto(true)); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	s.logger.Info(http.StatusAccepted, r.URL.Path, start)
}

func (s *Server) startTransmutation(alchemistID int, req *api.TransmutationRequestDto) (*models.Transmutation, error) {
	alch, err := s.AlchemistRepository.FindById(alchemistID)
	if err != nil {
		return nil, err
	}
	if alch == nil {
		return nil, errAlchemistNotFound
	}
	active, err := s.TransmutationRepository.HasActiveForAlchemist(alch.ID, transmutationStatusPendingApproval, transmutationStatusInProgress)
	if err != nil {
		return nil, err
	}
	if active {
		return nil, errTransmutationInProgress
	}

	desc := strings.TrimSpace(req.Description)
	if desc == "" {
		desc = "Generic transmutation"
	}

	simInput := &api.TransmutationSimulationRequestDto{
		Description:     desc,
		Complexity:      req.Complexity,
		RiskLevel:       req.RiskLevel,
		CatalystQuality: req.CatalystQuality,
		Materials:       req.Materials,
	}

	simulation, err := s.calculateTransmutationSimulation(simInput)
	if err != nil {
		return nil, err
	}
	durationSeconds := simulation.DurationSeconds
	if durationSeconds <= 0 {
		durationSeconds = int(s.transmutationDuration(desc).Seconds())
	}

	t := &models.Transmutation{
		Description:            desc,
		Status:                 transmutationStatusPendingApproval,
		AlchemistID:            alch.ID,
		Alchemist:              alch,
		EstimatedCost:          simulation.EstimatedCost,
		EstimatedDurationTotal: durationSeconds,
	}
	saved, err := s.TransmutationRepository.Save(t)
	if err != nil {
		return nil, err
	}
	saved.Alchemist = alch
	if err := s.createTransmutationAudit("TRANSMUTATION_REQUESTED", saved.ID, fmt.Sprintf("Transmutación #%d solicitada por %s", saved.ID, alch.Name)); err != nil {
		_ = s.TransmutationRepository.Delete(saved)
		return nil, err
	}

	//   notificar nueva transmutación en espera
	if s.WsHub != nil {
		_ = s.notify("transmutation:started", saved.ToResponseDto(true))
	}

	return saved, nil
}

func (s *Server) scheduleTransmutation(t *models.Transmutation) error {
	alch := t.Alchemist
	if alch == nil {
		found, err := s.AlchemistRepository.FindById(int(t.AlchemistID))
		if err != nil {
			return err
		}
		if found == nil {
			return fmt.Errorf("alchemist %d not found", t.AlchemistID)
		}
		alch = found
		t.Alchemist = alch
	}

	durationSeconds := t.EstimatedDurationTotal
	if durationSeconds <= 0 {
		durationSeconds = int(s.transmutationDuration(t.Description).Seconds())
		t.EstimatedDurationTotal = durationSeconds
	}
	duration := time.Duration(durationSeconds) * time.Second

	s.taskQueue.StartTask(int(t.AlchemistID), duration, func() error {
		if err := s.TransmutationRepository.UpdateStatus(t.ID, transmutationStatusCompleted); err != nil {
			return err
		}
		if err := s.createTransmutationAudit("TRANSMUTATION_COMPLETED", t.ID, fmt.Sprintf("Transmutación #%d completada para %s", t.ID, alch.Name)); err != nil {
		}
		// notificar completada (cargar DTO actualizado para enviar con alchemist)
		if s.WsHub != nil {
			if updated, e := s.TransmutationRepository.FindById(int(t.ID)); e == nil && updated != nil {
				_ = s.notify("transmutation:completed", updated.ToResponseDto(true))
			}
		}
		return nil
	})

	return nil
}

func (s *Server) calculateTransmutationSimulation(req *api.TransmutationSimulationRequestDto) (*api.TransmutationSimulationResponseDto, error) {
	desc := strings.TrimSpace(req.Description)

	complexityKey, complexityWeight, err := determineComplexity(desc, req.Complexity)
	if err != nil {
		return nil, err
	}

	riskKey, riskMultiplier, err := determineRisk(desc, req.RiskLevel)
	if err != nil {
		return nil, err
	}

	catalystQuality := deriveCatalystQuality(req.CatalystQuality, desc)

	baseMaterialCost, breakdown, err := s.computeMaterialsCost(req.Materials)
	if err != nil {
		return nil, err
	}

	arcaneEnergyCost := computeArcaneEnergyCost(desc, complexityWeight)
	catalystMod := computeCatalystModifier(catalystQuality)
	preModifiers := baseMaterialCost + arcaneEnergyCost
	estimatedCost := roundTwoDecimals(preModifiers * riskMultiplier * catalystMod)

	materialCount := len(breakdown)
	durationSeconds := s.estimateDurationSeconds(desc, complexityWeight, riskMultiplier, catalystQuality, materialCount)

	return &api.TransmutationSimulationResponseDto{
		Complexity:         complexityKey,
		RiskLevel:          riskKey,
		CatalystQuality:    catalystQuality,
		BaseMaterialCost:   roundTwoDecimals(baseMaterialCost),
		ArcaneEnergyCost:   roundTwoDecimals(arcaneEnergyCost),
		ComplexityWeight:   complexityWeight,
		RiskMultiplier:     riskMultiplier,
		CatalystModifier:   roundTwoDecimals(catalystMod),
		EstimatedCost:      estimatedCost,
		DurationSeconds:    durationSeconds,
		MaterialsBreakdown: breakdown,
	}, nil
}

func (s *Server) computeMaterialsCost(materials []api.TransmutationSimulationMaterialDto) (float64, []api.TransmutationSimulationMaterialBreakdownDto, error) {
	breakdown := make([]api.TransmutationSimulationMaterialBreakdownDto, 0, len(materials))
	if len(materials) == 0 {
		return 0, breakdown, nil
	}

	quantities := make(map[int]float64)
	order := make([]int, 0, len(materials))
	for _, item := range materials {
		if item.MaterialID <= 0 {
			return 0, nil, fmt.Errorf("%w: invalid material id %d", errInvalidMaterialQuantity, item.MaterialID)
		}
		if item.Quantity <= 0 {
			return 0, nil, fmt.Errorf("%w: material %d", errInvalidMaterialQuantity, item.MaterialID)
		}
		if _, ok := quantities[item.MaterialID]; !ok {
			order = append(order, item.MaterialID)
		}
		quantities[item.MaterialID] += item.Quantity
	}

	mats, err := s.MaterialRepository.FindByIDs(order)
	if err != nil {
		return 0, nil, err
	}

	found := make(map[int]*models.Material, len(mats))
	for _, mat := range mats {
		found[int(mat.ID)] = mat
	}

	missing := make([]int, 0)
	for _, id := range order {
		if _, ok := found[id]; !ok {
			missing = append(missing, id)
		}
	}
	if len(missing) > 0 {
		return 0, nil, fmt.Errorf("%w: %v", errMaterialNotFound, missing)
	}

	total := 0.0
	for _, id := range order {
		mat := found[id]
		qty := quantities[id]
		subtotal := mat.Cost * qty
		total += subtotal
		breakdown = append(breakdown, api.TransmutationSimulationMaterialBreakdownDto{
			MaterialID: id,
			Name:       mat.Name,
			Quantity:   roundTwoDecimals(qty),
			UnitCost:   roundTwoDecimals(mat.Cost),
			Subtotal:   roundTwoDecimals(subtotal),
		})
	}

	return total, breakdown, nil
}

func determineComplexity(description, provided string) (string, float64, error) {
	key := strings.ToUpper(strings.TrimSpace(provided))
	if key != "" {
		weight, ok := complexityWeights[key]
		if !ok {
			return "", 0, fmt.Errorf("%w: %s", errInvalidComplexityLevel, provided)
		}
		return key, weight, nil
	}

	desc := strings.ToLower(description)
	wordCount := len(strings.Fields(desc))
	switch {
	case strings.Contains(desc, "philosopher"), strings.Contains(desc, "forbidden"), strings.Contains(desc, "piedra filosof"):
		return "MASTER", complexityWeights["MASTER"], nil
	case wordCount > 18:
		return "HIGH", complexityWeights["HIGH"], nil
	case wordCount > 10:
		return "MEDIUM", complexityWeights["MEDIUM"], nil
	case wordCount <= 3 && wordCount > 0:
		return "TRIVIAL", complexityWeights["TRIVIAL"], nil
	case desc == "" || desc == "generic transmutation":
		return defaultComplexityKey, complexityWeights[defaultComplexityKey], nil
	default:
		return defaultComplexityKey, complexityWeights[defaultComplexityKey], nil
	}
}

func determineRisk(description, provided string) (string, float64, error) {
	key := strings.ToUpper(strings.TrimSpace(provided))
	if key != "" {
		mult, ok := riskMultipliers[key]
		if !ok {
			return "", 0, fmt.Errorf("%w: %s", errInvalidRiskLevel, provided)
		}
		return key, mult, nil
	}

	desc := strings.ToLower(description)
	switch {
	case strings.Contains(desc, "forbidden"), strings.Contains(desc, "humana"), strings.Contains(desc, "human"):
		return "CRITICAL", riskMultipliers["CRITICAL"], nil
	case strings.Contains(desc, "unstable"), strings.Contains(desc, "volatile"), strings.Contains(desc, "experimental"):
		return "HIGH", riskMultipliers["HIGH"], nil
	case strings.Contains(desc, "prototype"), strings.Contains(desc, "ensayo"):
		return "MEDIUM", riskMultipliers["MEDIUM"], nil
	case strings.TrimSpace(desc) == "" || desc == "generic transmutation":
		return defaultRiskKey, riskMultipliers[defaultRiskKey], nil
	default:
		return "LOW", riskMultipliers["LOW"], nil
	}
}

func deriveCatalystQuality(provided *int, description string) int {
	if provided != nil {
		return clamp(*provided, minCatalystQuality, maxCatalystQuality)
	}
	desc := strings.ToLower(description)
	switch {
	case strings.Contains(desc, "ancient"), strings.Contains(desc, "ancestral"), strings.Contains(desc, "pura"):
		return maxCatalystQuality
	case strings.Contains(desc, "refined"), strings.Contains(desc, "stabilized"), strings.Contains(desc, "estandar"):
		return 4
	case strings.Contains(desc, "improvised"), strings.Contains(desc, "unstable"), strings.Contains(desc, "mercurial"):
		return 2
	case desc == "" || desc == "generic transmutation":
		return defaultCatalystQuality
	default:
		return 3
	}
}

func computeArcaneEnergyCost(description string, complexityWeight float64) float64 {
	desc := strings.TrimSpace(description)
	if desc == "" || desc == "Generic transmutation" {
		return 30.0 * complexityWeight
	}
	words := len(strings.Fields(desc))
	runes := utf8.RuneCountInString(desc)
	base := 45.0 + float64(words)*3.2
	if runes > 120 {
		base += 18
	}
	lower := strings.ToLower(desc)
	if strings.Contains(lower, "human") || strings.Contains(lower, "humana") {
		base += 40
	} else if strings.Contains(lower, "metal") {
		base += 12
	}
	if strings.Contains(lower, "philosopher") || strings.Contains(lower, "piedra filosof") {
		base += 55
	}
	return base * complexityWeight
}

func computeCatalystModifier(quality int) float64 {
	diff := float64(defaultCatalystQuality - quality)
	modifier := 1 + diff*0.07
	if modifier < 0.6 {
		return 0.6
	}
	if modifier > 1.4 {
		return 1.4
	}
	return modifier
}

func (s *Server) estimateDurationSeconds(description string, complexityWeight, riskMultiplier float64, catalystQuality int, materialCount int) int {
	base := float64(s.Config.TransmutationDuration)
	high := float64(s.Config.TransmutationDurationHigh)
	if high < base {
		high = base
	}

	minWeight := complexityWeights["TRIVIAL"]
	maxWeight := complexityWeights["MASTER"]
	normalized := 0.0
	if maxWeight > minWeight {
		normalized = (complexityWeight - minWeight) / (maxWeight - minWeight)
	}
	if normalized < 0 {
		normalized = 0
	}
	if normalized > 1 {
		normalized = 1
	}

	duration := base + (high-base)*normalized
	words := len(strings.Fields(description))
	if words > 22 {
		duration += float64(words-22) * 0.8
	}
	duration *= riskMultiplier
	duration *= 1 + (float64(materialCount) * 0.04)
	duration *= 1 - ((float64(catalystQuality) - float64(defaultCatalystQuality)) * 0.03)
	if duration < base {
		duration = base
	}
	return int(math.Round(duration))
}

func clamp(value, min, max int) int {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

func roundTwoDecimals(value float64) float64 {
	return math.Round(value*100) / 100
}

func (s *Server) transmutationDuration(description string) time.Duration {
	desc := strings.TrimSpace(description)
	_, complexityWeight, _ := determineComplexity(desc, "")
	_, riskMultiplier, _ := determineRisk(desc, "")
	catalystQuality := deriveCatalystQuality(nil, desc)
	seconds := s.estimateDurationSeconds(desc, complexityWeight, riskMultiplier, catalystQuality, 0)
	if seconds <= 0 {
		seconds = s.Config.TransmutationDuration
	}
	return time.Duration(seconds) * time.Second
}

func (s *Server) handleGetTransmutationByID(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	id, err := strconv.Atoi(strings.TrimSpace(mux.Vars(r)["id"]))
	if err != nil {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, err)
		return
	}
	t, err := s.TransmutationRepository.FindById(id)
	if err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	if t == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(t.ToResponseDto(true)); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	s.logger.Info(http.StatusOK, r.URL.Path, start)
}
func (s *Server) handleUpdateTransmutationStatus(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	id, err := strconv.Atoi(strings.TrimSpace(mux.Vars(r)["id"]))
	if err != nil {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, err)
		return
	}
	var req api.TransmutationRequestDto
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, err)
		return
	}
	status := strings.ToUpper(strings.TrimSpace(req.Status))
	if status == "" {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, fmt.Errorf("status is required"))
		return
	}
	if !allowedTransmutationStatuses[status] {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, fmt.Errorf("invalid status %s", status))
		return
	}
	t, err := s.TransmutationRepository.FindById(id)
	if err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	if t == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	current := strings.ToUpper(strings.TrimSpace(t.Status))
	if current == status {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(t.ToResponseDto(true)); err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}
		s.logger.Info(http.StatusOK, r.URL.Path, start)
		return
	}
	if status == transmutationStatusInProgress {
		if current != transmutationStatusPendingApproval {
			s.HandleError(w, http.StatusBadRequest, r.URL.Path, fmt.Errorf("only pending transmutations can be approved"))
			return
		}
		if err := s.TransmutationRepository.UpdateStatus(t.ID, status); err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}
		t.Status = status

		alch := t.Alchemist
		if alch == nil {
			var fetchErr error
			alch, fetchErr = s.AlchemistRepository.FindById(int(t.AlchemistID))
			if fetchErr != nil {
				s.HandleError(w, http.StatusInternalServerError, r.URL.Path, fetchErr)
				return
			}
			if alch != nil {
				t.Alchemist = alch
			}
		}
		alchName := fmt.Sprintf("#%d", t.AlchemistID)
		if alch != nil {
			alchName = alch.Name
		}
		if err := s.createTransmutationAudit("TRANSMUTATION_APPROVED", t.ID, fmt.Sprintf("Transmutación #%d aprobada para %s", t.ID, alchName)); err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}
		if err := s.scheduleTransmutation(t); err != nil {
			_ = s.TransmutationRepository.UpdateStatus(t.ID, transmutationStatusPendingApproval)
			t.Status = transmutationStatusPendingApproval
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}

		if s.WsHub != nil {
			_ = s.notify("transmutation:updated", t.ToResponseDto(true))
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(t.ToResponseDto(true)); err != nil {
			s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
			return
		}
		s.logger.Info(http.StatusOK, r.URL.Path, start)
		return
	}
	if current == transmutationStatusInProgress && status != transmutationStatusInProgress {
		s.taskQueue.CancelTask(int(t.AlchemistID))
	}
	if err := s.TransmutationRepository.UpdateStatus(t.ID, status); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	t.Status = status
	if err := s.createTransmutationAudit("TRANSMUTATION_STATUS_UPDATED", t.ID, fmt.Sprintf("Transmutación #%d actualizada a %s", t.ID, status)); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}

	// notificar actualización de estado
	if s.WsHub != nil {
		_ = s.notify("transmutation:updated", t.ToResponseDto(true))
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(t.ToResponseDto(true)); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	s.logger.Info(http.StatusOK, r.URL.Path, start)
}

func (s *Server) handleCancelTransmutation(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	id, err := strconv.Atoi(strings.TrimSpace(mux.Vars(r)["id"]))
	if err != nil {
		s.HandleError(w, http.StatusBadRequest, r.URL.Path, err)
		return
	}
	t, err := s.TransmutationRepository.FindById(id)
	if err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	if t == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	status := strings.ToUpper(strings.TrimSpace(t.Status))
	if status == transmutationStatusCompleted || status == transmutationStatusFailed {
		s.HandleError(w, http.StatusConflict, r.URL.Path, fmt.Errorf("transmutation %d can no longer be cancelled", id))
		return
	}
	if status == transmutationStatusInProgress {
		s.taskQueue.CancelTask(int(t.AlchemistID))
	}
	if err := s.TransmutationRepository.UpdateStatus(t.ID, transmutationStatusCancelled); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	t.Status = transmutationStatusCancelled
	if err := s.createTransmutationAudit("TRANSMUTATION_CANCELLED", t.ID, fmt.Sprintf("Transmutación #%d cancelada", t.ID)); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}

	// notificar cancelación
	if s.WsHub != nil {
		_ = s.notify("transmutation:cancelled", t.ToResponseDto(true))
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(t.ToResponseDto(true)); err != nil {
		s.HandleError(w, http.StatusInternalServerError, r.URL.Path, err)
		return
	}
	s.logger.Info(http.StatusOK, r.URL.Path, start)
}

func (s *Server) createTransmutationAudit(action string, entityID uint, description string) error {
	_, err := s.AuditRepository.Save(&models.Audit{
		Action:      action,
		Entity:      auditEntityTransmutation,
		EntityID:    entityID,
		Description: description,
	})
	return err
}
