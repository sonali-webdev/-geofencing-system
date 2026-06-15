package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"geofencing-backend/config"
	"geofencing-backend/models"

	"github.com/google/uuid"
)


func IsPointInPolygon(lat, lng float64, coordinates []models.Coordinate) bool {
	n := len(coordinates)
	if n < 3 {
		return false 
	}

	inside := false

	j := n - 1

	for i := 0; i < n; i++ {
		xi := coordinates[i][1] 
		yi := coordinates[i][0] 

		xj := coordinates[j][1] 
		yj := coordinates[j][0] 

		intersect := ((yi > lat) != (yj > lat)) &&
			(lng < (xj-xi)*(lat-yi)/(yj-yi)+xi)

		if intersect {
			inside = !inside 
		}

		j = i
	}

	return inside
}

func CreateGeofence(req models.CreateGeofenceRequest) (*models.Geofence, error) {
	id := "geo_" + uuid.New().String()[:8]
	coordsJSON, err := json.Marshal(req.Coordinates)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal coordinates: %w", err)
	}

	query := `
		INSERT INTO geofences (id, name, description, coordinates, category, status)
		VALUES ($1, $2, $3, $4, $5, 'active')
		RETURNING id, name, description, coordinates, category, status, created_at, updated_at
	`

	var geofence models.Geofence
	var coordsRaw []byte 

	err = config.DB.QueryRow(
		query,
		id,
		req.Name,
		req.Description,
		coordsJSON,
		req.Category,
	).Scan(
		&geofence.ID,
		&geofence.Name,
		&geofence.Description,
		&coordsRaw, 
		&geofence.Category,
		&geofence.Status,
		&geofence.CreatedAt,
		&geofence.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create geofence: %w", err)
	}

	if err := json.Unmarshal(coordsRaw, &geofence.Coordinates); err != nil {
		return nil, fmt.Errorf("failed to parse coordinates: %w", err)
	}

	return &geofence, nil
}

func GetGeofences(category string) ([]models.Geofence, error) {
	var query string
	var rows *sql.Rows
	var err error

	if category != "" {
		query = `
			SELECT id, name, description, coordinates, category, status, created_at
			FROM geofences
			WHERE category = $1
			ORDER BY created_at DESC
		`
		rows, err = config.DB.Query(query, category)
	} else {
		query = `
			SELECT id, name, description, coordinates, category, status, created_at
			FROM geofences
			ORDER BY created_at DESC
		`
		rows, err = config.DB.Query(query)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get geofences: %w", err)
	}
	defer rows.Close()

	var geofences []models.Geofence

	for rows.Next() {
		var g models.Geofence
		var coordsRaw []byte

		err := rows.Scan(
			&g.ID,
			&g.Name,
			&g.Description,
			&coordsRaw,
			&g.Category,
			&g.Status,
			&g.CreatedAt,
		)
		if err != nil {
			log.Println("Error scanning geofence row:", err)
			continue
		}

		if err := json.Unmarshal(coordsRaw, &g.Coordinates); err != nil {
			log.Println("Error parsing coordinates:", err)
			continue
		}

		geofences = append(geofences, g)
	}

	if geofences == nil {
		geofences = []models.Geofence{}
	}

	return geofences, nil
}

func GetAllGeofencesForChecking() ([]models.Geofence, error) {
	return GetGeofences("")
}

func ValidateGeofenceCoordinates(coords []models.Coordinate) error {
	if len(coords) < 4 {
		return fmt.Errorf("minimum 4 coordinate points required")
	}

	for i, coord := range coords {
		lat := coord[0]
		lng := coord[1]

		if lat < -90 || lat > 90 {
			return fmt.Errorf("coordinate %d: latitude must be between -90 and 90", i)
		}
		if lng < -180 || lng > 180 {
			return fmt.Errorf("coordinate %d: longitude must be between -180 and 180", i)
		}
	}

	first := coords[0]
	last := coords[len(coords)-1]
	if first[0] != last[0] || first[1] != last[1] {
		return fmt.Errorf("first and last coordinates must be identical (closed polygon)")
	}

	return nil
}

func ValidateCategory(category string) error {
	validCategories := map[string]bool{
		"delivery_zone":  true,
		"restricted_zone": true,
		"toll_zone":      true,
		"customer_area":  true,
	}

	if !validCategories[category] {
		return fmt.Errorf("invalid category. Must be one of: delivery_zone, restricted_zone, toll_zone, customer_area")
	}
	return nil
}

func GetGeofenceByID(id string) (*models.Geofence, error) {
	query := `
		SELECT id, name, description, coordinates, category, status, created_at
		FROM geofences WHERE id = $1
	`

	var g models.Geofence
	var coordsRaw []byte

	err := config.DB.QueryRow(query, id).Scan(
		&g.ID,
		&g.Name,
		&g.Description,
		&coordsRaw,
		&g.Category,
		&g.Status,
		&g.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil 
	}
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(coordsRaw, &g.Coordinates); err != nil {
		return nil, err
	}

	return &g, nil
}

func StartTimer() time.Time {
	return time.Now()
}

func GetElapsedNS(start time.Time) string {
	return fmt.Sprintf("%d", time.Since(start).Nanoseconds())
}