import asyncio
import json
import websockets
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("AGENT_TOKEN")


ALLOWED = {
  "shutdown": "sudo /sbin/shutdown now",
  "reboot": "sudo /sbin/reboot",
  "suspend": "sudo /bin/systemctl suspend",
  "ping": "makefoot"
}


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
    uri = "ws://127.0.0.1:8000/ws/control/"

    async with websockets.connect(uri) as websocket:
        print("Agent conectado")

        asyncio.create_task(heartbeat(websocket))

        while True:
            message = await websocket.recv()
            data = json.loads(message)

            if data.get("type") != "command":
                continue

            feedback = execute(data.get("action"), data)

            await websocket.send(json.dumps({
                "type": "feedback",
                "role": "agent",
                **feedback
            }))

asyncio.run(listen())