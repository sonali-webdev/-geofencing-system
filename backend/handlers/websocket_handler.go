package handlers

import (
	ws "geofencing-backend/websocket"

	"github.com/gin-gonic/gin"
)

type WebSocketHandler struct {
	hub *ws.Hub
}

func NewWebSocketHandler(hub *ws.Hub) *WebSocketHandler {
	return &WebSocketHandler{hub: hub}
}

func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	h.hub.ServeWS(c.Writer, c.Request)
}