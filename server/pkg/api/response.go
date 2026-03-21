package api

import (
	"net/http"

	"server/internal/model"

	"github.com/gin-gonic/gin"
)

func Success[T any](c *gin.Context, data T) {
	c.JSON(http.StatusOK, model.ApiResponse[T]{
		Code:    0,
		Message: "",
		Data:    data,
	})
}

func Error(c *gin.Context, status int, code int, msg string, details ...string) {
	err := model.ApiError{
		Code:    code,
		Message: msg,
	}
	if len(details) > 0 {
		err.Details = details[0]
	}
	c.JSON(status, err)
}

func BadRequest(c *gin.Context, msg string) {
	Error(c, http.StatusBadRequest, 400, msg)
}

func NotFound(c *gin.Context, msg string) {
	Error(c, http.StatusNotFound, 404, msg)
}

func InternalError(c *gin.Context, err error) {
	Error(c, http.StatusInternalServerError, 500, "internal server error", err.Error())
}
