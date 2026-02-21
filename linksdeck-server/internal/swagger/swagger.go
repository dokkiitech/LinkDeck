package swagger

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"

	"gopkg.in/yaml.v3"
)

type docs struct {
	once          sync.Once
	jsonOpenAPI   []byte
	loadError     error
	openAPIPath   string
}

func New(openAPIPath string) *docs {
	return &docs{openAPIPath: openAPIPath}
}

func (d *docs) OpenAPIJSONHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		d.once.Do(func() {
			raw, err := os.ReadFile(d.openAPIPath)
			if err != nil {
				d.loadError = err
				return
			}
			var parsed any
			if err := yaml.Unmarshal(raw, &parsed); err != nil {
				d.loadError = err
				return
			}
			jsonBytes, err := json.Marshal(parsed)
			if err != nil {
				d.loadError = err
				return
			}
			d.jsonOpenAPI = jsonBytes
		})

		if d.loadError != nil {
			http.Error(w, d.loadError.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(d.jsonOpenAPI)
	}
}

func (d *docs) SwaggerUIHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = fmt.Fprintf(w, `<!DOCTYPE html>
<html>
  <head>
    <title>LinksDeck Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function() {
        window.ui = SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout'
        });
      };
    </script>
  </body>
</html>`)
	}
}
