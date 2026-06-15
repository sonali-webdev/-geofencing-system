package models

import "time"

type AlertConfig struct {
	ID          string    `json:"alert_id"`
	GeofenceID  string    `json:"geofence_id"`
	GeofenceName string   `json:"geofence_name,omitempty"`
	VehicleID   string    `json:"vehicle_id,omitempty"`
	VehicleNumber string  `json:"vehicle_number,omitempty"`
	EventType   string    `json:"event_type"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

type ConfigureAlertRequest struct {
	GeofenceID string `json:"geofence_id" binding:"required"`
	VehicleID  string `json:"vehicle_id"`  // optional
	EventType  string `json:"event_type" binding:"required"`
}

type ConfigureAlertResponse struct {
	AlertID    string `json:"alert_id"`
	GeofenceID string `json:"geofence_id"`
	VehicleID  string `json:"vehicle_id,omitempty"`
	EventType  string `json:"event_type"`
	Status     string `json:"status"`
	TimeNS     string `json:"time_ns"`
}

type GetAlertsResponse struct {
	Alerts []AlertConfig `json:"alerts"`
	TimeNS string        `json:"time_ns"`
}

type WebSocketAlertMessage struct {
	EventID   string          `json:"event_id"`
	EventType string          `json:"event_type"`
	Timestamp string          `json:"timestamp"`
	Vehicle   AlertVehicleInfo  `json:"vehicle"`
	Geofence  AlertGeofenceInfo `json:"geofence"`
	Location  AlertLocation     `json:"location"`
}

type AlertVehicleInfo struct {
	VehicleID     string `json:"vehicle_id"`
	VehicleNumber string `json:"vehicle_number"`
	DriverName    string `json:"driver_name"`
}

type AlertGeofenceInfo struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Category     string `json:"category"`
}

type AlertLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}