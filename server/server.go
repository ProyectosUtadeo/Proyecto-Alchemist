package server

import (
	"backend-avanzada/config"
	"backend-avanzada/logger"
	"backend-avanzada/models"
	"backend-avanzada/repository"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Server struct {
	DB      *gorm.DB
	Config  *config.Config
	Handler http.Handler

	// Legacy repositories (del proyecto base)
	PeopleRepository repository.Repository[models.Person]
	KillRepository   repository.Repository[models.Kill]

	// Repositorios del proyecto Amestris
	AlchemistRepository     *repository.AlchemistRepository
	MaterialRepository      *repository.MaterialRepository
	MissionRepository       *repository.MissionRepository
	TransmutationRepository *repository.TransmutationRepository
	AuditRepository         *repository.AuditRepository

	// 👇👇👇 NUEVO
	UserRepository *repository.UserRepository

	// 👇👇👇 NUEVO: Hub de WebSocket para notificaciones en tiempo real
	WsHub *Hub

	logger    *logger.Logger
	taskQueue *TaskQueue
}

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

	// 👇👇👇 NUEVO: inicializar y ejecutar el hub de WebSocket
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
			port = "5432" // valor por defecto
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
		// Legacy
		&models.Person{},
		&models.Kill{},

		// Amestris
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
	// Legacy
	s.KillRepository = repository.NewKillRepository(s.DB)
	s.PeopleRepository = repository.NewPeopleRepository(s.DB)

	// Amestris
	s.AlchemistRepository = repository.NewAlchemistRepository(s.DB)
	s.MaterialRepository = repository.NewMaterialRepository(s.DB)
	s.MissionRepository = repository.NewMissionRepository(s.DB)
	s.TransmutationRepository = repository.NewTransmutationRepository(s.DB)
	s.AuditRepository = repository.NewAuditRepository(s.DB)
	s.UserRepository = repository.NewUserRepository(s.DB)

	fmt.Println("✅ Base de datos y repositorios inicializados correctamente.")
}
