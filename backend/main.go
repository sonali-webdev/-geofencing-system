package main

import (
	"log"
	"os"

	"geofencing-backend/config"
	"geofencing-backend/handlers"
	"geofencing-backend/websocket"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// ── Step 1: Load .env file ──────────────────────────
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// ── Step 2: Connect to Database ─────────────────────
	config.ConnectDatabase()
	defer config.DB.Close()

	// ── Step 3: Create WebSocket Hub ────────────────────
	hub := websocket.NewHub()
	go hub.Run()

	// ── Step 4: Create Gin Router ───────────────────────
	router := gin.Default()

	// ── Step 5: Add CORS Middleware ──────────────────────
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// ── Step 6: Create Handler Instances ─────────────────
	geofenceHandler := handlers.NewGeofenceHandler()
	vehicleHandler := handlers.NewVehicleHandler(hub)
	alertHandler := handlers.NewAlertHandler()
	violationHandler := handlers.NewViolationHandler()
	wsHandler := handlers.NewWebSocketHandler(hub)

	// ── Step 7: Define All Routes ────────────────────────

	// Geofence routes
	router.POST("/geofences", geofenceHandler.CreateGeofence)
	router.GET("/geofences", geofenceHandler.GetGeofences)

	// Vehicle routes
	router.POST("/vehicles", vehicleHandler.CreateVehicle)
	router.GET("/vehicles", vehicleHandler.GetVehicles)
	router.POST("/vehicles/location", vehicleHandler.UpdateLocation)
	router.GET("/vehicles/location/:vehicle_id", vehicleHandler.GetVehicleLocation)

	// Alert routes
	router.POST("/alerts/configure", alertHandler.ConfigureAlert)
	router.GET("/alerts", alertHandler.GetAlerts)

	// Violation history route
	router.GET("/violations/history", violationHandler.GetViolationHistory)

	// ── WebSocket route ──────────────────────────────────
	// THIS WAS MISSING BEFORE - that caused the error!
	router.GET("/ws/alerts", wsHandler.HandleWebSocket)

	// ── Step 8: Start Server ─────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("📡 WebSocket available at ws://localhost:%s/ws/alerts", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}