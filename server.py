from __future__ import annotations

import argparse
import json
import os
import socket
import threading
import urllib.error
import urllib.request
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_PORT = 8778
MAX_BODY_BYTES = 24 * 1024 * 1024
MAX_RESPONSE_BYTES = 4 * 1024 * 1024


class UserFacingError(Exception):
    pass


class VideoLevelCounterHandler(SimpleHTTPRequestHandler):
    server_version = "VideoLevelCounter/1.0"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def translate_path(self, path: str) -> str:
        return super().translate_path(strip_mount_path(path))

    def do_POST(self) -> None:
        if strip_mount_path(self.path) != "/api/vision-name":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        try:
            payload = self.read_json_body()
            response_status, response_headers, response_body = forward_vision_request(payload)
            self.send_response(response_status)
            self.send_header("X-Video-Counter-Proxy", "1")
            self.send_header("Content-Type", response_headers.get("Content-Type", "application/json; charset=utf-8"))
            self.send_header("Content-Length", str(len(response_body)))
            self.end_headers()
            self.wfile.write(response_body)
        except UserFacingError as exc:
            self.send_json({"error": {"message": str(exc)}}, HTTPStatus.BAD_REQUEST)
        except Exception as exc:
            self.send_json(
                {"error": {"message": f"本地代理请求失败：{exc}"}},
                HTTPStatus.BAD_GATEWAY,
            )

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def read_json_body(self) -> dict[str, Any]:
        content_type = self.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            raise UserFacingError("请求格式必须是 application/json。")

        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            raise UserFacingError("请求内容为空。")
        if content_length > MAX_BODY_BYTES:
            raise UserFacingError("请求内容过大。")

        raw_body = self.rfile.read(content_length)
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise UserFacingError("JSON 内容无法解析。") from exc
        if not isinstance(payload, dict):
            raise UserFacingError("JSON 内容必须是对象。")
        return payload

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Expose-Headers", "X-Video-Counter-Proxy")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Video-Counter-Proxy", "1")
        super().end_headers()

    def send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def forward_vision_request(payload: dict[str, Any]) -> tuple[int, dict[str, str], bytes]:
    endpoint = str(payload.get("endpoint") or "").strip()
    api_key = str(payload.get("apiKey") or "").strip() or environment_naming_api_key(endpoint)
    body = payload.get("body")

    if not endpoint:
        raise UserFacingError("缺少 API 地址。")
    if not api_key:
        raise UserFacingError("缺少视觉命名 Key。请在页面填写 Key，或启动服务前设置 OPENAI_API_KEY / LUMOS_API_KEY。")
    if not isinstance(body, dict):
        raise UserFacingError("缺少模型请求内容。")

    parsed = urlparse(endpoint)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc:
        raise UserFacingError("API 地址必须是 http 或 https URL。")

    request_body = json.dumps(body, ensure_ascii=False).encode("utf-8")

    try:
        return send_model_request(endpoint, api_key, request_body, use_system_proxy=True)
    except urllib.error.URLError as exc:
        if is_connection_refused(exc):
            try:
                return send_model_request(endpoint, api_key, request_body, use_system_proxy=False)
            except urllib.error.URLError as retry_exc:
                raise UserFacingError(
                    f"目标 API 地址拒绝连接：{safe_endpoint(endpoint)}。已自动绕过 Windows 系统代理重试，仍无法连接。"
                    "请检查 API 地址是否正确，或检查本机代理软件是否已启动。"
                ) from retry_exc
        raise UserFacingError(
            f"无法连接目标 API 地址：{safe_endpoint(endpoint)}。{summarize_url_error(exc)}"
        ) from exc


def environment_naming_api_key(endpoint: str) -> str:
    names = ["VIDEO_COUNTER_NAMING_API_KEY"]
    if "lumos" in endpoint.lower():
        names.extend(["LUMOS_API_KEY", "OPENAI_API_KEY"])
    else:
        names.extend(["OPENAI_API_KEY", "LUMOS_API_KEY"])
    for name in names:
        value = os.environ.get(name, "").strip()
        if value:
            return value
    return ""


def send_model_request(
    endpoint: str,
    api_key: str,
    request_body: bytes,
    use_system_proxy: bool,
) -> tuple[int, dict[str, str], bytes]:
    request = urllib.request.Request(
        endpoint,
        data=request_body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    opener = urllib.request.build_opener() if use_system_proxy else urllib.request.build_opener(urllib.request.ProxyHandler({}))

    try:
        with opener.open(request, timeout=90) as response:
            return (
                response.status,
                {"Content-Type": response.headers.get("Content-Type", "application/json; charset=utf-8")},
                response.read(MAX_RESPONSE_BYTES),
            )
    except urllib.error.HTTPError as exc:
        return (
            exc.code,
            {"Content-Type": exc.headers.get("Content-Type", "application/json; charset=utf-8")},
            exc.read(MAX_RESPONSE_BYTES),
        )


def is_connection_refused(exc: urllib.error.URLError) -> bool:
    reason = getattr(exc, "reason", exc)
    if isinstance(reason, ConnectionRefusedError):
        return True
    if isinstance(reason, OSError) and getattr(reason, "winerror", None) == 10061:
        return True
    return "10061" in str(reason) or "connection refused" in str(reason).lower()


def safe_endpoint(endpoint: str) -> str:
    parsed = urlparse(endpoint)
    if not parsed.netloc:
        return endpoint
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"


def summarize_url_error(exc: urllib.error.URLError) -> str:
    reason = getattr(exc, "reason", exc)
    if isinstance(reason, socket.timeout):
        return "连接超时，请检查网络或 API 地址。"
    return str(reason)


def strip_mount_path(path: str) -> str:
    if path == "/video-level-counter":
        return "/"
    if path.startswith("/video-level-counter/"):
        return path[len("/video-level-counter") :]
    return path


def open_browser_later(port: int) -> None:
    threading.Timer(0.8, lambda: webbrowser.open(f"http://127.0.0.1:{port}/")).start()


def create_server(preferred_port: int) -> tuple[ThreadingHTTPServer, int]:
    ports = [preferred_port]
    if preferred_port == DEFAULT_PORT:
        ports.extend(range(DEFAULT_PORT + 1, DEFAULT_PORT + 20))

    last_error: OSError | None = None
    for port in ports:
        try:
            return ThreadingHTTPServer(("127.0.0.1", port), VideoLevelCounterHandler), port
        except OSError as exc:
            last_error = exc
    raise last_error or OSError("没有可用端口")


def main() -> None:
    parser = argparse.ArgumentParser(description="Local video level counter")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    server, port = create_server(args.port)
    if not args.no_browser:
        open_browser_later(port)
    print(f"Serving video-level-counter at http://127.0.0.1:{port}/")
    server.serve_forever()


if __name__ == "__main__":
    main()
