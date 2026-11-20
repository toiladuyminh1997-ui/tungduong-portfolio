"""Server xem thử web ở máy (hỗ trợ tua video - HTTP Range).
Chạy:  py server.py   rồi mở http://localhost:8080
"""
import http.server, os, re, socketserver, webbrowser

PORT = 8080
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        size = os.path.getsize(path)
        start = int(m.group(1)) if m and m.group(1) else 0
        end = int(m.group(2)) if m and m.group(2) else size - 1
        end = min(end, size - 1)
        if start >= size:
            self.send_error(416)
            return None
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        self._remaining = end - start + 1
        return f

    def copyfile(self, src, dst):
        rem = getattr(self, "_remaining", None)
        if rem is None:
            return super().copyfile(src, dst)
        try:
            while rem > 0:
                buf = src.read(min(1 << 16, rem))
                if not buf:
                    break
                dst.write(buf)
                rem -= len(buf)
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
            pass
        finally:
            self._remaining = None

    def log_message(self, *a):
        pass


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    with Server(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"Portfolio dang chay tai {url}  (Ctrl+C de tat)")
        if not os.environ.get("NO_BROWSER"):
            webbrowser.open(url)
        httpd.serve_forever()
