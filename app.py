#!/usr/bin/env python3
"""Starts the FULL KIT dev server and opens it in the browser.

Usage:
    python app.py
"""

import platform
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PORT = 3000
URL = f"http://localhost:{PORT}"
PROJECT_DIR = Path(__file__).resolve().parent
NPM = "npm.cmd" if platform.system() == "Windows" else "npm"


def server_is_up() -> bool:
    try:
        urllib.request.urlopen(URL, timeout=1)
        return True
    except urllib.error.URLError:
        return False
    except Exception:
        return False


def wait_for_server(process: subprocess.Popen, timeout: float = 60.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if process.poll() is not None:
            return False
        if server_is_up():
            return True
        time.sleep(0.5)
    return False


def main() -> None:
    if server_is_up():
        print(f"FULL KIT já está rodando em {URL}, abrindo o navegador...")
        webbrowser.open(URL)
        return

    print(f"Iniciando o servidor em {PROJECT_DIR}...")
    process = subprocess.Popen(
        [NPM, "run", "dev"],
        cwd=str(PROJECT_DIR),
    )

    try:
        if not wait_for_server(process):
            print("O servidor não respondeu a tempo. Veja o log acima para o erro.")
            process.terminate()
            sys.exit(1)

        print(f"Pronto! Abrindo {URL} no navegador...")
        webbrowser.open(URL)

        print("Servidor rodando. Pressione Ctrl+C para encerrar.")
        process.wait()
    except KeyboardInterrupt:
        print("\nEncerrando o servidor...")
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == "__main__":
    main()
