package models

import "time"

type Vehicle struct {
	ID            string    `json:"id"`
	VehicleNumber string    `json:"vehicle_number"`
	DriverName    string    `json:"driver_name"`
	VehicleType   string    `json:"vehicle_type"`
	Phone         string    `json:"phone"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type VehicleLocation struct {
	ID        int64     `json:"id"`
	VehicleID string    `json:"vehicle_id"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Timestamp time.Time `json:"timestamp"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateVehicleRequest struct {
	VehicleNumber string `json:"vehicle_number" binding:"required"`
	DriverName    string `json:"driver_name" binding:"required"`
	VehicleType   string `json:"vehicle_type" binding:"required"`
	Phone         string `json:"phone" binding:"required"`
}

type UpdateLocationRequest struct {
	VehicleID string  `json:"vehicle_id" binding:"required"`
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
	Timestamp string  `json:"timestamp" binding:"required"`
}

type CurrentGeofenceStatus struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Status       string `json:"status"`
	Category     string `json:"category,omitempty"`
}

type CreateVehicleResponse struct {
	ID            string `json:"id"`
	VehicleNumber string `json:"vehicle_number"`
	Status        string `json:"status"`
	TimeNS        string `json:"time_ns"`
}

type UpdateLocationResponse struct {
	VehicleID       string                  `json:"vehicle_id"`
	LocationUpdated bool                    `json:"location_updated"`
	CurrentGeofences []CurrentGeofenceStatus `json:"current_geofences"`
	TimeNS          string                  `json:"time_ns"`
}

type GetVehiclesResponse struct {
	Vehicles []Vehicle `json:"vehicles"`
	TimeNS   string    `json:"time_ns"`
}

type GetVehicleLocationResponse struct {
	VehicleID       string                  `json:"vehicle_id"`
	VehicleNumber   string                  `json:"vehicle_number"`
	CurrentLocation *LocationData           `json:"current_location"`
	CurrentGeofences []CurrentGeofenceStatus `json:"current_geofences"`
	TimeNS          string                  `json:"time_ns"`
}

type LocationData struct {
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Timestamp time.Time `json:"timestamp"`
}