package handlers

import (
	"net/http"
	"time"

	"geofencing-backend/models"
	"geofencing-backend/services"

	"github.com/gin-gonic/gin"
)

type AlertHandler struct{}

func NewAlertHandler() *AlertHandler {
	return &AlertHandler{}
}

func (h *AlertHandler) ConfigureAlert(c *gin.Context) {
	start := time.Now()

	var req models.ConfigureAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	validEvents := map[string]bool{"entry": true, "exit": true, "both": true}
	if !validEvents[req.EventType] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "event_type must be one of: entry, exit, both",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	alert, err := services.CreateAlertConfig(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create alert",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	c.JSON(http.StatusCreated, models.ConfigureAlertResponse{
		AlertID:    alert.ID,
		GeofenceID: alert.GeofenceID,
		VehicleID:  alert.VehicleID,
		EventType:  alert.EventType,
		Status:     alert.Status,
		TimeNS:     services.GetElapsedNS(start),
	})
}

func (h *AlertHandler) GetAlerts(c *gin.Context) {
	start := time.Now()

	geofenceID := c.Query("geofence_id")
	vehicleID := c.Query("vehicle_id")

	alerts, err := services.GetAlertConfigs(geofenceID, vehicleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch alerts",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	c.JSON(http.StatusOK, models.GetAlertsResponse{
		Alerts: alerts,
		TimeNS: services.GetElapsedNS(start),
	})
}