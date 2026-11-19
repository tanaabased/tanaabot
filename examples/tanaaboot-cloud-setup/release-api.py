import json
import ssl
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


root = Path(sys.argv[1])
endpoint = "/repos/tanaabased/tanaabot/releases"


class ReleaseAPI(BaseHTTPRequestHandler):
    def do_GET(self):
        request = urlsplit(self.path)
        config = json.loads((root / "responses.json").read_text())
        next_page = None
        if request.path == endpoint + "/latest":
            body = config.get("latest", 404)
        elif request.path == endpoint:
            page = int(parse_qs(request.query).get("page", ["1"])[0])
            pages = config["pages"]
            body = pages[page - 1]
            if page < len(pages):
                next_page = page + 1
        else:
            body = 500

        status = body if isinstance(body, int) else 200
        if status != 200:
            body = {"message": "Not Found" if status == 404 else "Fixture lookup failure"}
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        if next_page:
            self.send_header(
                "Link", f'<https://api.github.com{endpoint}?page={next_page}&per_page=100>; rel="next"'
            )
        self.end_headers()
        self.wfile.write(payload)


with HTTPServer(("127.0.0.1", 0), ReleaseAPI) as server:
    tls = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    tls.load_cert_chain(root / "cert.pem", root / "key.pem")
    server.socket = tls.wrap_socket(server.socket, server_side=True)
    (root / "port").write_text(str(server.server_port))
    server.serve_forever()
