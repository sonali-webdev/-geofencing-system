package services

import (
	"database/sql"
	"fmt"
	"log"

	"geofencing-backend/config"
	"geofencing-backend/models"

	"github.com/google/uuid"
)

func CreateAlertConfig(req models.ConfigureAlertRequest) (*models.AlertConfig, error) {
	id := "alert_" + uuid.New().String()[:8]

	query := `
		INSERT INTO alert_configs (id, geofence_id, vehicle_id, event_type, status)
		VALUES ($1, $2, NULLIF($3, ''), $4, 'active')
		RETURNING id, geofence_id, COALESCE(vehicle_id, ''), event_type, status, created_at
	`

	var alert models.AlertConfig
	err := config.DB.QueryRow(
		query,
		id,
		req.GeofenceID,
		req.VehicleID,
		req.EventType,
	).Scan(
		&alert.ID,
		&alert.GeofenceID,
		&alert.VehicleID,
		&alert.EventType,
		&alert.Status,
		&alert.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create alert config: %w", err)
	}

	return &alert, nil
}

func GetAlertConfigs(geofenceID, vehicleID string) ([]models.AlertConfig, error) {
	query := `
		SELECT 
			ac.id, 
			ac.geofence_id,
			COALESCE(g.name, '') as geofence_name,
			COALESCE(ac.vehicle_id, '') as vehicle_id,
			COALESCE(v.vehicle_number, '') as vehicle_number,
			ac.event_type,
			ac.status,
			ac.created_at
		FROM alert_configs ac
		LEFT JOIN geofences g ON g.id = ac.geofence_id
		LEFT JOIN vehicles v ON v.id = ac.vehicle_id
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if geofenceID != "" {
		query += fmt.Sprintf(" AND ac.geofence_id = $%d", argCount)
		args = append(args, geofenceID)
		argCount++
	}

	if vehicleID != "" {
		query += fmt.Sprintf(" AND ac.vehicle_id = $%d", argCount)
		args = append(args, vehicleID)
		argCount++
	}

	query += " ORDER BY ac.created_at DESC"

	rows, err := config.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get alerts: %w", err)
	}
	defer rows.Close()

	var alerts []models.AlertConfig
	for rows.Next() {
		var a models.AlertConfig
		err := rows.Scan(
			&a.ID,
			&a.GeofenceID,
			&a.GeofenceName,
			&a.VehicleID,
			&a.VehicleNumber,
			&a.EventType,
			&a.Status,
			&a.CreatedAt,
		)
		if err != nil {
			log.Println("Error scanning alert:", err)
			continue
		}
		alerts = append(alerts, a)
	}

	if alerts == nil {
		alerts = []models.AlertConfig{}
	}

	return alerts, nil
}

func CheckAlertConfigs(vehicleID, geofenceID, eventType string) ([]models.AlertConfig, error) {
	query := `
		SELECT 
			ac.id, ac.geofence_id, ac.vehicle_id, ac.event_type, ac.status
		FROM alert_configs ac
		WHERE ac.geofence_id = $1
		AND ac.status = 'active'
		AND (ac.vehicle_id = $2 OR ac.vehicle_id IS NULL)
		AND (ac.event_type = $3 OR ac.event_type = 'both')
	`

	rows, err := config.DB.Query(query, geofenceID, vehicleID, eventType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matchingAlerts []models.AlertConfig
	for rows.Next() {
		var a models.AlertConfig
		var vehicleIDNull sql.NullString
		rows.Scan(&a.ID, &a.GeofenceID, &vehicleIDNull, &a.EventType, &a.Status)
		if vehicleIDNull.Valid {
			a.VehicleID = vehicleIDNull.String
		}
		matchingAlerts = append(matchingAlerts, a)
	}

	return matchingAlerts, nil
}

func SaveViolation(vehicleID, geofenceID, eventType string, lat, lng float64, timestamp interface{}) (string, error) {
	id := "viol_" + uuid.New().String()[:8]

	query := `
		INSERT INTO violations (id, vehicle_id, geofence_id, event_type, latitude, longitude, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := config.DB.Exec(query, id, vehicleID, geofenceID, eventType, lat, lng, timestamp)
	if err != nil {
		return "", fmt.Errorf("failed to save violation: %w", err)
	}

	return id, nil
}