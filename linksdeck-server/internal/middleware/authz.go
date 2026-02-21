package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"linksdeck-server/internal/auth"
	"linksdeck-server/internal/repository"
)

type Authz struct {
	verifier *auth.Verifier
	store    *repository.Store
}

func NewAuthz(verifier *auth.Verifier, store *repository.Store) *Authz {
	return &Authz{verifier: verifier, store: store}
}

func (a *Authz) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isPublicRoute(r.Method, r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}

		principal, err := a.verifier.VerifyAuthorizationHeader(r.Context(), r.Header.Get("Authorization"))
		if err != nil {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		if err := a.store.UpsertUser(r.Context(), principal.UserID, principal.Email, principal.DisplayName); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to sync user")
			return
		}

		if isAdminRoute(r.URL.Path) {
			isDeveloper, err := a.store.IsDeveloper(r.Context(), principal.UserID)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "failed to check developer role")
				return
			}
			if !isDeveloper {
				writeError(w, http.StatusForbidden, "forbidden")
				return
			}
		}

		next.ServeHTTP(w, r.WithContext(auth.WithPrincipal(r.Context(), principal)))
	})
}

func isPublicRoute(method, path string) bool {
	switch {
	case method == http.MethodGet && path == "/v1/health/live":
		return true
	case method == http.MethodGet && path == "/v1/health/ready":
		return true
	case method == http.MethodGet && path == "/v1/maintenance/status":
		return true
	case strings.HasPrefix(path, "/swagger"):
		return true
	case path == "/openapi.json":
		return true
	default:
		return false
	}
}

func isAdminRoute(path string) bool {
	return strings.HasPrefix(path, "/v1/admin/")
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": message})
}
