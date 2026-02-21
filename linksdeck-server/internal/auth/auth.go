package auth

import (
	"context"
	"fmt"
	"strings"

	firebase "firebase.google.com/go/v4"
	firebaseauth "firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

type Principal struct {
	UserID      string
	Email       *string
	DisplayName *string
}

type contextKey string

const principalContextKey contextKey = "principal"

type Verifier struct {
	client *firebaseauth.Client
}

func NewVerifier(ctx context.Context, projectID, serviceAccountJSON string) (*Verifier, error) {
	cfg := &firebase.Config{ProjectID: projectID}
	options := make([]option.ClientOption, 0, 1)
	if serviceAccountJSON != "" {
		options = append(options, option.WithCredentialsJSON([]byte(serviceAccountJSON)))
	}

	app, err := firebase.NewApp(ctx, cfg, options...)
	if err != nil {
		return nil, fmt.Errorf("failed to init firebase app: %w", err)
	}

	client, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to init firebase auth client: %w", err)
	}

	return &Verifier{client: client}, nil
}

func (v *Verifier) VerifyAuthorizationHeader(ctx context.Context, authorizationHeader string) (*Principal, error) {
	tokenString, err := parseBearerToken(authorizationHeader)
	if err != nil {
		return nil, err
	}

	token, err := v.client.VerifyIDToken(ctx, tokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	principal := &Principal{UserID: token.UID}
	if emailRaw, ok := token.Claims["email"].(string); ok && strings.TrimSpace(emailRaw) != "" {
		emailCopy := emailRaw
		principal.Email = &emailCopy
	}
	if nameRaw, ok := token.Claims["name"].(string); ok && strings.TrimSpace(nameRaw) != "" {
		nameCopy := nameRaw
		principal.DisplayName = &nameCopy
	}

	return principal, nil
}

func parseBearerToken(header string) (string, error) {
	if header == "" {
		return "", fmt.Errorf("missing authorization header")
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", fmt.Errorf("invalid authorization header format")
	}
	token := strings.TrimSpace(parts[1])
	if token == "" {
		return "", fmt.Errorf("empty bearer token")
	}
	return token, nil
}

func WithPrincipal(ctx context.Context, principal *Principal) context.Context {
	return context.WithValue(ctx, principalContextKey, principal)
}

func PrincipalFromContext(ctx context.Context) (*Principal, bool) {
	value := ctx.Value(principalContextKey)
	principal, ok := value.(*Principal)
	if !ok || principal == nil {
		return nil, false
	}
	return principal, true
}
