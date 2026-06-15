package models

import "time"

type Coordinate [2]float64

type Geofence struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Coordinates []Coordinate `json:"coordinates"`
	Category    string       `json:"category"`
	Status      string       `json:"status"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type CreateGeofenceRequest struct {
	Name        string       `json:"name" binding:"required"`
	Description string       `json:"description"`
	Coordinates []Coordinate `json:"coordinates" binding:"required"`
	Category    string       `json:"category" binding:"required"`
}

type GeofenceResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
	TimeNS string `json:"time_ns"`
}

type GetGeofencesResponse struct {
	Geofences []Geofence `json:"geofences"`
	TimeNS    string     `json:"time_ns"`
}