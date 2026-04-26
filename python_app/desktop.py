import socket
import sys
import threading
import time
from pathlib import Path

import uvicorn

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from python_app.app.main import app


HOST = "127.0.0.1"
PORT = 8000
URL = f"http://{HOST}:{PORT}"


def port_is_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.25)
        return sock.connect_ex((host, port)) == 0


def start_server() -> None:
    if port_is_open(HOST, PORT):
        return

    config = uvicorn.Config(app, host=HOST, port=PORT, log_level="warning")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    for _ in range(80):
        if port_is_open(HOST, PORT):
            return
        time.sleep(0.1)

    raise RuntimeError("YourPath AI server did not start.")


def main() -> None:
    try:
        import webview
    except ImportError as exc:
        raise SystemExit(
            "pywebview is not installed. Run:\n"
            "python -m pip install pywebview\n\n"
            "Then start again:\n"
            "python python_app/desktop.py"
        ) from exc

    start_server()
    webview.create_window(
        "YourPath AI",
        URL,
        width=1440,
        height=920,
        min_size=(1100, 720),
        text_select=True,
    )
    webview.start()


if __name__ == "__main__":
    main()
