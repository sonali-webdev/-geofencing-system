package services

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"geofencing-backend/config"
	"geofencing-backend/models"

	"github.com/google/uuid"
)

func CreateVehicle(req models.CreateVehicleRequest) (*models.Vehicle, error) {
	id := "veh_" + uuid.New().String()[:8]

	query := `
		INSERT INTO vehicles (id, vehicle_number, driver_name, vehicle_type, phone, status)
		VALUES ($1, $2, $3, $4, $5, 'active')
		RETURNING id, vehicle_number, driver_name, vehicle_type, phone, status, created_at
	`

	var vehicle models.Vehicle
	err := config.DB.QueryRow(
		query,
		id,
		req.VehicleNumber,
		req.DriverName,
		req.VehicleType,
		req.Phone,
	).Scan(
		&vehicle.ID,
		&vehicle.VehicleNumber,
		&vehicle.DriverName,
		&vehicle.VehicleType,
		&vehicle.Phone,
		&vehicle.Status,
		&vehicle.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create vehicle: %w", err)
	}

	return &vehicle, nil
}

func GetVehicles() ([]models.Vehicle, error) {
	query := `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone, status, created_at
		FROM vehicles
		ORDER BY created_at DESC
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get vehicles: %w", err)
	}
	defer rows.Close()

	var vehicles []models.Vehicle
	for rows.Next() {
		var v models.Vehicle
		err := rows.Scan(
			&v.ID,
			&v.VehicleNumber,
			&v.DriverName,
			&v.VehicleType,
			&v.Phone,
			&v.Status,
			&v.CreatedAt,
		)
		if err != nil {
			log.Println("Error scanning vehicle:", err)
			continue
		}
		vehicles = append(vehicles, v)
	}

	if vehicles == nil {
		vehicles = []models.Vehicle{}
	}

	return vehicles, nil
}

func UpdateVehicleLocation(req models.UpdateLocationRequest) ([]models.CurrentGeofenceStatus, []GeofenceEvent, error) {
	timestamp, err := time.Parse(time.RFC3339, req.Timestamp)
	if err != nil {
		timestamp = time.Now()
	}

	insertQuery := `
		INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, timestamp)
		VALUES ($1, $2, $3, $4)
	`
	_, err = config.DB.Exec(insertQuery, req.VehicleID, req.Latitude, req.Longitude, timestamp)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to save location: %w", err)
	}

	geofences, err := GetAllGeofencesForChecking()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get geofences: %w", err)
	}

	var currentGeofences []models.CurrentGeofenceStatus
	var events []GeofenceEvent


	for _, geofence := range geofences {
		isCurrentlyInside := IsPointInPolygon(req.Latitude, req.Longitude, geofence.Coordinates)

		wasPreviouslyInside := getPreviousState(req.VehicleID, geofence.ID)

		if isCurrentlyInside && !wasPreviouslyInside {
			events = append(events, GeofenceEvent{
				VehicleID:  req.VehicleID,
				GeofenceID: geofence.ID,
				EventType:  "entry",
				Latitude:   req.Latitude,
				Longitude:  req.Longitude,
				Timestamp:  timestamp,
				Geofence:   geofence,
			})
			log.Printf("🚨 ENTRY EVENT: Vehicle %s entered geofence %s", req.VehicleID, geofence.Name)
		} else if !isCurrentlyInside && wasPreviouslyInside {
			events = append(events, GeofenceEvent{
				VehicleID:  req.VehicleID,
				GeofenceID: geofence.ID,
				EventType:  "exit",
				Latitude:   req.Latitude,
				Longitude:  req.Longitude,
				Timestamp:  timestamp,
				Geofence:   geofence,
			})
			log.Printf("🚨 EXIT EVENT: Vehicle %s exited geofence %s", req.VehicleID, geofence.Name)
		}

		updateState(req.VehicleID, geofence.ID, isCurrentlyInside)

		if isCurrentlyInside {
			currentGeofences = append(currentGeofences, models.CurrentGeofenceStatus{
				GeofenceID:   geofence.ID,
				GeofenceName: geofence.Name,
				Status:       "inside",
			})
		}
	}

	if currentGeofences == nil {
		currentGeofences = []models.CurrentGeofenceStatus{}
	}

	return currentGeofences, events, nil
}

type GeofenceEvent struct {
	VehicleID  string
	GeofenceID string
	EventType  string
	Latitude   float64
	Longitude  float64
	Timestamp  time.Time
	Geofence   models.Geofence
}

func getPreviousState(vehicleID, geofenceID string) bool {
	query := `
		SELECT is_inside FROM vehicle_geofence_state
		WHERE vehicle_id = $1 AND geofence_id = $2
	`

	var isInside bool
	err := config.DB.QueryRow(query, vehicleID, geofenceID).Scan(&isInside)

	if err == sql.ErrNoRows {
		return false
	}
	if err != nil {
		log.Println("Error getting previous state:", err)
		return false
	}

	return isInside
}

func updateState(vehicleID, geofenceID string, isInside bool) {
	query := `
		INSERT INTO vehicle_geofence_state (vehicle_id, geofence_id, is_inside, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (vehicle_id, geofence_id)
		DO UPDATE SET is_inside = $3, updated_at = NOW()
	`

	_, err := config.DB.Exec(query, vehicleID, geofenceID, isInside)
	if err != nil {
		log.Println("Error updating state:", err)
	}
}

func GetVehicleCurrentLocation(vehicleID string) (*models.LocationData, error) {
	query := `
		SELECT latitude, longitude, timestamp
		FROM vehicle_locations
		WHERE vehicle_id = $1
		ORDER BY timestamp DESC
		LIMIT 1
	`

	var loc models.LocationData
	err := config.DB.QueryRow(query, vehicleID).Scan(
		&loc.Latitude,
		&loc.Longitude,
		&loc.Timestamp,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &loc, nil
}

func GetVehicleByID(id string) (*models.Vehicle, error) {
	query := `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone, status, created_at
		FROM vehicles WHERE id = $1
	`

	var v models.Vehicle
	err := config.DB.QueryRow(query, id).Scan(
		&v.ID,
		&v.VehicleNumber,
		&v.DriverName,
		&v.VehicleType,
		&v.Phone,
		&v.Status,
		&v.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &v, nil
}

func GetCurrentGeofencesForVehicle(vehicleID string) ([]models.CurrentGeofenceStatus, error) {
	query := `
		SELECT vgs.geofence_id, g.name, g.category
		FROM vehicle_geofence_state vgs
		JOIN geofences g ON g.id = vgs.geofence_id
		WHERE vgs.vehicle_id = $1 AND vgs.is_inside = true
	`

	rows, err := config.DB.Query(query, vehicleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.CurrentGeofenceStatus
	for rows.Next() {
		var s models.CurrentGeofenceStatus
		rows.Scan(&s.GeofenceID, &s.GeofenceName, &s.Category)
		result = append(result, s)
	}

	if result == nil {
		result = []models.CurrentGeofenceStatus{}
	}

	return result, nil
}