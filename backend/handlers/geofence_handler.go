package handlers

import (
	"net/http"
	"time"

	"geofencing-backend/models"
	"geofencing-backend/services"

	"github.com/gin-gonic/gin"
)

type GeofenceHandler struct{}

func NewGeofenceHandler() *GeofenceHandler {
	return &GeofenceHandler{}
}

func (h *GeofenceHandler) CreateGeofence(c *gin.Context) {
	start := time.Now()

	var req models.CreateGeofenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	if err := services.ValidateCategory(req.Category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	if err := services.ValidateGeofenceCoordinates(req.Coordinates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	geofence, err := services.CreateGeofence(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create geofence",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	c.JSON(http.StatusCreated, models.GeofenceResponse{
		ID:     geofence.ID,
		Name:   geofence.Name,
		Status: geofence.Status,
		TimeNS: services.GetElapsedNS(start),
	})
}

func (h *GeofenceHandler) GetGeofences(c *gin.Context) {
	start := time.Now()

	category := c.Query("category")

	geofences, err := services.GetGeofences(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch geofences",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}

	c.JSON(http.StatusOK, models.GetGeofencesResponse{
		Geofences: geofences,
		TimeNS:    services.GetElapsedNS(start),
	})
}