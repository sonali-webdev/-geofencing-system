package handlers

import (
	"net/http"
	"strconv"
	"time"

	"geofencing-backend/config"
	"geofencing-backend/models"
	"geofencing-backend/services"

	"github.com/gin-gonic/gin"
)

type ViolationHandler struct{}

func NewViolationHandler() *ViolationHandler {
	return &ViolationHandler{}
}

func (h *ViolationHandler) GetViolationHistory(c *gin.Context) {
	start := time.Now()

	vehicleID := c.Query("vehicle_id")
	geofenceID := c.Query("geofence_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	limitStr := c.DefaultQuery("limit", "50")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}

	query := `
		SELECT 
			v.id,
			v.vehicle_id,
			ve.vehicle_number,
			v.geofence_id,
			g.name as geofence_name,
			v.event_type,
			v.latitude,
			v.longitude,
			v.timestamp
		FROM violations v
		JOIN vehicles ve ON ve.id = v.vehicle_id
		JOIN geofences g ON g.id = v.geofence_id
		WHERE 1=1
	`

	countQuery := `
		SELECT COUNT(*) FROM violations v
		JOIN vehicles ve ON ve.id = v.vehicle_id
		JOIN geofences g ON g.id = v.geofence_id
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if vehicleID != "" {
		filter := ` AND v.vehicle_id = $` + strconv.Itoa(argCount)
		query += filter
		countQuery += filter
		args = append(args, vehicleID)
		argCount++
	}

	if geofenceID != "" {
		filter := ` AND v.geofence_id = $` + strconv.Itoa(argCount)
		query += filter
		countQuery += filter
		args = append(args, geofenceID)
		argCount++
	}

	if startDate != "" {
		filter := ` AND v.timestamp >= $` + strconv.Itoa(argCount)
		query += filter
		countQuery += filter
		args = append(args, startDate)
		argCount++
	}

	if endDate != "" {
		filter := ` AND v.timestamp <= $` + strconv.Itoa(argCount)
		query += filter
		countQuery += filter
		args = append(args, endDate)
		argCount++
	}

	var totalCount int
	config.DB.QueryRow(countQuery, args...).Scan(&totalCount)

	query += ` ORDER BY v.timestamp DESC LIMIT $` + strconv.Itoa(argCount)
	args = append(args, limit)

	rows, err := config.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch violations",
			"time_ns": services.GetElapsedNS(start),
		})
		return
	}
	defer rows.Close()

	var violations []models.Violation
	for rows.Next() {
		var v models.Violation
		err := rows.Scan(
			&v.ID,
			&v.VehicleID,
			&v.VehicleNumber,
			&v.GeofenceID,
			&v.GeofenceName,
			&v.EventType,
			&v.Latitude,
			&v.Longitude,
			&v.Timestamp,
		)
		if err != nil {
			continue
		}
		violations = append(violations, v)
	}

	if violations == nil {
		violations = []models.Violation{}
	}

	c.JSON(http.StatusOK, models.GetViolationHistoryResponse{
		Violations: violations,
		TotalCount: totalCount,
		TimeNS:     services.GetElapsedNS(start),
	})
}