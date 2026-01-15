import asyncio
import json
import websockets
import subprocess


ALLOWED = {
  "shutdown": "sudo /sbin/shutdown now",
  "reboot": "sudo /sbin/reboot",
  "suspend": "sudo /bin/systemctl suspend"
}


def run(cmd):
    subprocess.Popen(cmd, shell=True)

def execute(action, data):
    if action not in ALLOWED and action != "shutdown_with_time":
        print("❌ Comando não permitido")
        return
    
    if action == "shutdown_with_time":
        minutes = data.get("minutes")

        if not isinstance(minutes, int) or minutes <= 0:
            print("❌ Minutos inválidos")
            return
        run(f"sudo /sbin/shutdown +{minutes}")
        print(f"⏱️ Desligamento em {minutes} minutos")
        return

    run(ALLOWED[action])
    print(f"✅ Executado: {action}")

async def heartbeat(websocket):
    while True:
        await websocket.send(json.dumps({
            "type": "heartbeat",
            "role": "agent"
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

            print("📩 Comando recebido:", data)
            execute(data.get("action"), data)

asyncio.run(listen())