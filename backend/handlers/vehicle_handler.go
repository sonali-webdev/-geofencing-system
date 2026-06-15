package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"geofencing-backend/models"
	"geofencing-backend/services"
	ws "geofencing-backend/websocket"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VehicleHandler struct {
	hub *ws.Hub
}

func NewVehicleHandler(hub *ws.Hub) *VehicleHandler {
	return &VehicleHandler{hub: hub}
}

func (h *VehicleHandler) CreateVehicle(c *gin.Context) {
	start := time.Now()

	var req models.CreateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	vehicle, err := services.CreateVehicle(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create vehicle",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	c.JSON(http.StatusCreated, models.CreateVehicleResponse{
		ID:            vehicle.ID,
		VehicleNumber: vehicle.VehicleNumber,
		Status:        vehicle.Status,
		TimeNS:        services.GetElapsedNS(start),
	})
}

func (h *VehicleHandler) GetVehicles(c *gin.Context) {
	start := time.Now()

	vehicles, err := services.GetVehicles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch vehicles",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	c.JSON(http.StatusOK, models.GetVehiclesResponse{
		Vehicles: vehicles,
		TimeNS:   services.GetElapsedNS(start),
	})
}

func (h *VehicleHandler) UpdateLocation(c *gin.Context) {
	start := time.Now()

	var req models.UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	if req.Latitude < -90 || req.Latitude > 90 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Latitude must be between -90 and 90",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}
	if req.Longitude < -180 || req.Longitude > 180 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Longitude must be between -180 and 180",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	vehicle, err := services.GetVehicleByID(req.VehicleID)
	if err != nil || vehicle == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Vehicle not found",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	currentGeofences, events, err := services.UpdateVehicleLocation(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update location",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	go func() {
		for _, event := range events {
			h.processGeofenceEvent(vehicle, event)
		}
	}()

	c.JSON(http.StatusOK, models.UpdateLocationResponse{
		VehicleID:        req.VehicleID,
		LocationUpdated:  true,
		CurrentGeofences: currentGeofences,
		TimeNS:           services.GetElapsedNS(start),
	})
}

func (h *VehicleHandler) processGeofenceEvent(vehicle *models.Vehicle, event services.GeofenceEvent) {
	matchingAlerts, err := services.CheckAlertConfigs(
		event.VehicleID,
		event.GeofenceID,
		event.EventType,
	)
	if err != nil {
		log.Println("Error checking alert configs:", err)
	}

	_, err = services.SaveViolation(
		event.VehicleID,
		event.GeofenceID,
		event.EventType,
		event.Latitude,
		event.Longitude,
		event.Timestamp,
	)
	if err != nil {
		log.Println("Error saving violation:", err)
	}

	if len(matchingAlerts) > 0 {
		alertMsg := models.WebSocketAlertMessage{
			EventID:   "evt_" + uuid.New().String()[:8],
			EventType: event.EventType,
			Timestamp: event.Timestamp.Format(time.RFC3339),
			Vehicle: models.AlertVehicleInfo{
				VehicleID:     vehicle.ID,
				VehicleNumber: vehicle.VehicleNumber,
				DriverName:    vehicle.DriverName,
			},
			Geofence: models.AlertGeofenceInfo{
				GeofenceID:   event.Geofence.ID,
				GeofenceName: event.Geofence.Name,
				Category:     event.Geofence.Category,
			},
			Location: models.AlertLocation{
				Latitude:  event.Latitude,
				Longitude: event.Longitude,
			},
		}

		msgBytes, err := json.Marshal(alertMsg)
		if err != nil {
			log.Println("Error marshaling alert:", err)
			return
		}

		h.hub.BroadcastAlert(msgBytes)
		log.Printf("📡 Alert broadcasted: %s %s %s",
			event.EventType, vehicle.VehicleNumber, event.Geofence.Name)
	} else {
		if event.Geofence.Category == "restricted_zone" {
			alertMsg := models.WebSocketAlertMessage{
				EventID:   "evt_" + uuid.New().String()[:8],
				EventType: event.EventType,
				Timestamp: event.Timestamp.Format(time.RFC3339),
				Vehicle: models.AlertVehicleInfo{
					VehicleID:     vehicle.ID,
					VehicleNumber: vehicle.VehicleNumber,
					DriverName:    vehicle.DriverName,
				},
				Geofence: models.AlertGeofenceInfo{
					GeofenceID:   event.Geofence.ID,
					GeofenceName: event.Geofence.Name,
					Category:     event.Geofence.Category,
				},
				Location: models.AlertLocation{
					Latitude:  event.Latitude,
					Longitude: event.Longitude,
				},
			}

			msgBytes, _ := json.Marshal(alertMsg)
			h.hub.BroadcastAlert(msgBytes)
			log.Printf("🚨 RESTRICTED ZONE ALERT: %s", fmt.Sprintf("%s %s", vehicle.VehicleNumber, event.Geofence.Name))
		}
	}
}

func (h *VehicleHandler) GetVehicleLocation(c *gin.Context) {
	start := time.Now()

	vehicleID := c.Param("vehicle_id")

	vehicle, err := services.GetVehicleByID(vehicleID)
	if err != nil || vehicle == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Vehicle not found",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	location, err := services.GetVehicleCurrentLocation(vehicleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get location",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	currentGeofences, err := services.GetCurrentGeofencesForVehicle(vehicleID)
	if err != nil {
		currentGeofences = []models.CurrentGeofenceStatus{}
	}

	c.JSON(http.StatusOK, models.GetVehicleLocationResponse{
		VehicleID:        vehicle.ID,
		VehicleNumber:    vehicle.VehicleNumber,
		CurrentLocation:  location,
		CurrentGeofences: currentGeofences,
		TimeNS:           services.GetElapsedNS(start),
	})
}