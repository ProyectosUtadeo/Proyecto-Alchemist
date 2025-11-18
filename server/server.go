package server

import (
	"backend-avanzada/config"
	"backend-avanzada/logger"
	"backend-avanzada/models"
	"backend-avanzada/repository"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/handlers"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Server struct {
	DB      *gorm.DB
	Config  *config.Config
	Handler http.Handler

	// Repositorios del proyecto Amestris
	AlchemistRepository     *repository.AlchemistRepository
	MaterialRepository      *repository.MaterialRepository
	MissionRepository       *repository.MissionRepository
	TransmutationRepository *repository.TransmutationRepository
	AuditRepository         *repository.AuditRepository
	UserRepository          *repository.UserRepository

	// Hub de WebSocket para notificaciones en tiempo real
	WsHub *Hub

	logger    *logger.Logger
	taskQueue *TaskQueue
}

const (
	defaultDailyCheckHour            = "02:00"
	defaultMaterialLowStockThreshold = 10.0
	defaultMissionStaleDays          = 7
	auditActionDailyMaterialAlert    = "DAILY_MATERIAL_ALERT"
	auditActionDailyMissionAlert     = "DAILY_MISSION_ALERT"
	auditEntityMaterial              = "material"
	auditEntityMission               = "mission"
)

func NewServer() *Server {
	s := &Server{
		logger:    logger.NewLogger(),
		taskQueue: NewTaskQueue(),
	}

	var cfg config.Config
	configFile, err := os.ReadFile("config/config.json")
	if err != nil {
		s.logger.Fatal(err)
	}
	if err := json.Unmarshal(configFile, &cfg); err != nil {
		s.logger.Fatal(err)
	}
	s.Config = &cfg
	return s
}

func (s *Server) StartServer() {
	fmt.Println("🔧 Inicializando base de datos...")
	s.initDB()

	s.startDailyVerifications()

	s.WsHub = NewHub()
	go s.WsHub.Run()

	fmt.Println("🌐 Configurando CORS...")
	corsObj := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"}),
	)

	fmt.Println("🧩 Inicializando rutas (mux)...")
	srv := &http.Server{
		Addr:    s.Config.Address,
		Handler: corsObj(s.router()),
	}

	fmt.Println("🚀 Servidor escuchando en el puerto", s.Config.Address)
	if err := srv.ListenAndServe(); err != nil {
		s.logger.Fatal(err)
	}
}

func (s *Server) initDB() {
	switch s.Config.Database {
	case "sqlite":
		db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
		if err != nil {
			s.logger.Fatal(err)
		}
		s.DB = db

	case "postgres":
		// Usa variables del .env seteadas en docker-compose
		host := os.Getenv("POSTGRES_HOST")
		user := os.Getenv("POSTGRES_USER")
		pass := os.Getenv("POSTGRES_PASSWORD")
		dbn := os.Getenv("POSTGRES_DB")
		port := os.Getenv("POSTGRES_PORT")
		if port == "" {
			port = "5432"
		}

		dsn := fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
			host, user, pass, dbn, port,
		)
		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			s.logger.Fatal(err)
		}
		s.DB = db

	default:
		s.logger.Fatal(fmt.Errorf("⚠️ tipo de base de datos desconocido: %s", s.Config.Database))
	}

	fmt.Println("📦 Aplicando migraciones...")
	if err := s.DB.AutoMigrate(
		&models.Alchemist{},
		&models.Material{},
		&models.Mission{},
		&models.Transmutation{},
		&models.Audit{},
		&models.User{},
	); err != nil {
		s.logger.Fatal(err)
	}

	fmt.Println("🔗 Inicializando repositorios...")
	s.AlchemistRepository = repository.NewAlchemistRepository(s.DB)
	s.MaterialRepository = repository.NewMaterialRepository(s.DB)
	s.MissionRepository = repository.NewMissionRepository(s.DB)
	s.TransmutationRepository = repository.NewTransmutationRepository(s.DB)
	s.AuditRepository = repository.NewAuditRepository(s.DB)
	s.UserRepository = repository.NewUserRepository(s.DB)

	fmt.Println("✅ Base de datos y repositorios inicializados correctamente.")
}

func (s *Server) startDailyVerifications() {
	if s.MaterialRepository == nil || s.MissionRepository == nil || s.AuditRepository == nil {
		return
	}
	go func() {
		s.logger.Printf("⏰ Iniciando rutina de verificaciones diarias")
		if err := s.runDailyChecks(); err != nil {
			s.logger.Printf("⚠️ Error en verificación diaria inicial: %v", err)
		}
		for {
			next := s.nextDailyCheck(time.Now())
			wait := time.Until(next)
			if wait <= 0 {
				wait = 24 * time.Hour
			}
			time.Sleep(wait)
			if err := s.runDailyChecks(); err != nil {
				s.logger.Printf("⚠️ Error en verificación diaria: %v", err)
			}
		}
	}()
}

func (s *Server) nextDailyCheck(now time.Time) time.Time {
	hour := defaultDailyCheckHour
	if s.Config != nil && s.Config.DailyCheckHour != "" {
		hour = s.Config.DailyCheckHour
	}
	parsed, err := time.Parse("15:04", hour)
	if err != nil {
		s.logger.Printf("⚠️ No se pudo interpretar daily_check_hour (%s): %v", hour, err)
		parsed, _ = time.Parse("15:04", defaultDailyCheckHour)
	}
	target := time.Date(now.Year(), now.Month(), now.Day(), parsed.Hour(), parsed.Minute(), 0, 0, now.Location())
	if !target.After(now) {
		target = target.Add(24 * time.Hour)
	}
	return target
}

func (s *Server) runDailyChecks() error {
	var errs []error
	if err := s.checkMaterialUsage(); err != nil {
		errs = append(errs, fmt.Errorf("material usage: %w", err))
	}
	if err := s.checkStaleMissions(); err != nil {
		errs = append(errs, fmt.Errorf("missions: %w", err))
	}
	if len(errs) > 0 {
		return errors.Join(errs...)
	}
	s.logger.Printf("✅ Verificaciones diarias completadas")
	return nil
}

func (s *Server) checkMaterialUsage() error {
	threshold := defaultMaterialLowStockThreshold
	if s.Config != nil && s.Config.MaterialLowStockThreshold > 0 {
		threshold = s.Config.MaterialLowStockThreshold
	}
	materials, err := s.MaterialRepository.FindLowStock(threshold)
	if err != nil {
		return err
	}
	if len(materials) == 0 {
		s.logger.Printf("🔍 Verificación diaria: sin alertas de materiales (umbral %.2f)", threshold)
		return nil
	}
	var errs []error
	for _, m := range materials {
		description := fmt.Sprintf("Material %s (#%d) con stock %.2f por debajo del umbral %.2f", m.Name, m.ID, m.Stock, threshold)
		s.logger.Printf("⚠️ %s", description)
		if _, saveErr := s.AuditRepository.Save(&models.Audit{
			Action:      auditActionDailyMaterialAlert,
			Entity:      auditEntityMaterial,
			EntityID:    m.ID,
			Description: description,
		}); saveErr != nil {
			errs = append(errs, saveErr)
		}
	}
	if len(errs) > 0 {
		return errors.Join(errs...)
	}
	return nil
}

func (s *Server) checkStaleMissions() error {
	staleDays := defaultMissionStaleDays
	if s.Config != nil && s.Config.MissionStaleDays > 0 {
		staleDays = s.Config.MissionStaleDays
	}
	cutoff := time.Now().AddDate(0, 0, -staleDays)
	missions, err := s.MissionRepository.FindStale(cutoff, []string{"COMPLETED", "CANCELLED"})
	if err != nil {
		return err
	}
	if len(missions) == 0 {
		s.logger.Printf("🔍 Verificación diaria: sin misiones atrasadas (límite %d días)", staleDays)
		return nil
	}
	var errs []error
	for _, mission := range missions {
		assigned := "sin asignar"
		if mission.AssignedTo != nil && mission.AssignedTo.Name != "" {
			assigned = mission.AssignedTo.Name
		}
		lastUpdate := mission.UpdatedAt
		if lastUpdate.IsZero() {
			lastUpdate = mission.CreatedAt
		}
		description := fmt.Sprintf("Misión %s (#%d) sin cerrar desde %s (estado %s, asignado a %s)", mission.Title, mission.ID, lastUpdate.Format(time.RFC3339), mission.Status, assigned)
		s.logger.Printf("⚠️ %s", description)
		if _, saveErr := s.AuditRepository.Save(&models.Audit{
			Action:      auditActionDailyMissionAlert,
			Entity:      auditEntityMission,
			EntityID:    mission.ID,
			Description: description,
		}); saveErr != nil {
			errs = append(errs, saveErr)
		}
	}
	if len(errs) > 0 {
		return errors.Join(errs...)
	}
	return nil
}
