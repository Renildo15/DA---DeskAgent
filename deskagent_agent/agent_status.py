import asyncio
import json
import websockets
import subprocess
import os
from dotenv import load_dotenv
import time
import signal
import sys
import psutil
import socket
import getpass

load_dotenv()
URL = os.getenv("PUBLIC_WS_URL_STATUS")


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # não envia nada de verdade
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"
    
async def heartbeat(websocket):
    while True:
        await websocket.send(json.dumps({
            "type": "heartbeat",
            "role": "agent",
        }))

        await asyncio.sleep(3)

def collect_system_info():
    return {
        "type": "pc_info",
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory": psutil.virtual_memory().used,
        "memory_total": psutil.virtual_memory().total,
        "disk_usage": psutil.disk_usage('/').used,
        "disk_total": psutil.disk_usage('/').total,
        "uptime": time.time() - psutil.boot_time(),
        "timestamp": time.time(),
        "system": os.uname().sysname,
        "node_name": os.uname().nodename,
        "user": getpass.getuser(),
        "ip_local": get_local_ip(),
    }

async def send_system_info():
    async with websockets.connect(URL) as ws:
        await ws.send(json.dumps({
            "type": "hello",
            "role": "agent",
        }))

        asyncio.create_task(heartbeat(ws))

        while True:
            info = collect_system_info()
            print("Enviando info do sistema:", info)
            await ws.send(json.dumps(info))
            await asyncio.sleep(3)

asyncio.run(send_system_info())