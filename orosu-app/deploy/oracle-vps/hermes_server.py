#!/usr/bin/env python3
"""
Hermes Agent HTTP Sidecar Daemon for Oracle VPS.
Exposes endpoints for Render/Vercel to query Hermes Agent directly.
"""

import os
import json
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.environ.get("PORT", "8000"))
API_KEY = os.environ.get("HERMES_API_KEY", "")
HERMES_CLI = os.environ.get("HERMES_CLI_PATH", "hermes")


class HermesHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: dict):
        response_bytes = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, x-api-key")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, x-api-key")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            self._send_json(200, {"status": "ok", "service": "Hermes Agent VPS Daemon", "port": PORT})
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        if API_KEY:
            request_key = self.headers.get("x-api-key", "")
            if request_key != API_KEY:
                self._send_json(401, {"error": "Unauthorized: Invalid API Key"})
                return

        if self.path == "/api/hermes/exec":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                payload = json.loads(body)
                prompt = payload.get("prompt", "")
                timeout_s = int(payload.get("timeoutMs", 30000)) // 1000

                if not prompt:
                    self._send_json(400, {"error": "prompt is required"})
                    return

                # Execute hermes -z
                process = subprocess.run(
                    [HERMES_CLI, "-z", prompt],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=timeout_s,
                )

                output = process.stdout.strip()
                if not output and process.stderr:
                    output = process.stderr.strip()

                # Extract JSON if present
                first_brace = output.find("{")
                last_brace = output.rfind("}")
                if first_brace != -1 and last_brace != -1:
                    json_data = json.loads(output[first_brace : last_brace + 1])
                    self._send_json(200, {"success": True, "data": json_data})
                else:
                    self._send_json(200, {"success": True, "raw": output})

            except subprocess.TimeoutExpired:
                self._send_json(504, {"error": "Hermes execution timed out"})
            except Exception as e:
                self._send_json(500, {"error": str(e)})
        else:
            self._send_json(404, {"error": "Not Found"})


def main():
    server = HTTPServer(("0.0.0.0", PORT), HermesHandler)
    print(f"🚀 Hermes Agent Server listening on http://0.0.0.0:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
