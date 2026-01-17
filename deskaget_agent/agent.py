import asyncio
import json
import websockets
import subprocess
import os
from dotenv import load_dotenv
import time

load_dotenv()
TOKEN = os.getenv("AGENT_TOKEN")
URL = os.getenv("PUBLIC_WS_URL")

ALLOWED = {
  "shutdown": "sudo /sbin/shutdown now",
  "reboot": "sudo /sbin/reboot",
  "suspend": "sudo /bin/systemctl suspend",
  "cancel": "sudo /bin/shutdown -t",
  "ping": "makefoot"
}

async def send_log(ws, level, message):
    await ws.send(json.dumps({
        "type": "log",
        "level": level,
        "source": "agent",
        "message": message,
        "timestamp": time.time()
    }))


def run(cmd):
    subprocess.Popen(cmd, shell=True)

def execute(action, data):
    if action not in ALLOWED and action != "shutdown_with_time":
        return {
            "status": "error",
            "message": "Comando não permitido"
        }
    
    if action == "shutdown_with_time":
        minutes = data.get("minutes")

        if not isinstance(minutes, int) or minutes <= 0:
            return {
                "status": "error",
                "message": "Minutos inválidos"
            }
        run(f"sudo /sbin/shutdown +{minutes}")
        return {
            "status": "success",
            "message": f"Desligamento agendado para {minutes} minutos"
        }

    run(ALLOWED[action])
    return {
        "status": "success",
        "message": f"Comando '{action}' executado"
    }

async def heartbeat(websocket):
    while True:
        await websocket.send(json.dumps({
            "type": "heartbeat",
            "role": "agent",
            "token": TOKEN
        }))

        await asyncio.sleep(5)

async def listen():
    uri = URL
    async with websockets.connect(uri) as websocket:
        await send_log(websocket, "info", "Agent conectado")

        await websocket.send(json.dumps({
            "type": "hello",
            "role": "agent",
            "token": TOKEN
        }))

        asyncio.create_task(heartbeat(websocket))

        while True:
            message = await websocket.recv()
            data = json.loads(message)

            if data.get("type") != "command":
                continue

            feedback = execute(data.get("action"), data)

            if feedback["status"] == "success":
                await send_log(websocket, "success", feedback["message"])
            else:
                await send_log(websocket, "error", feedback["message"])

        
            await websocket.send(json.dumps({
                "type": "feedback",
                "role": "agent",
                **feedback
            }))

asyncio.run(listen())