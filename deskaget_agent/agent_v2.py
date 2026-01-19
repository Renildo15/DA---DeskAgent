from configs import ALLOWED, TOKEN, URL
import asyncio
import json
import websockets
import subprocess
import time
import signal
import sys


class Agent:
    def __init__(self):
        self.running = True

    def shutdown(self, sig, frame):
        print("🛑 Encerrando agent...")
        self.running = False

    async def send_log(self, ws, level, message):
        await ws.send(json.dumps({
            "type": "log",
            "level": level,
            "source": "agent",
            "message": message,
            "timestamp": time.time()
        }))

    def run(self, cmd):
        subprocess.Popen(cmd, shell=True)

    def execute(self, action, data):
        if action not in ALLOWED and action != "shutdown_with_time":
            return {"status": "error", "message": "Comando não permitido"}

        if action == "shutdown_with_time":
            minutes = data.get("minutes")
            if not isinstance(minutes, int) or minutes <= 0:
                return {"status": "error", "message": "Minutos inválidos"}

            self.run(f"sudo /sbin/shutdown +{minutes}")
            return {
                "status": "success",
                "message": f"Desligamento agendado para {minutes} minutos"
            }

        self.run(ALLOWED[action])
        return {"status": "success", "message": f"Comando '{action}' executado"}

    async def heartbeat(self, ws):
        while self.running:
            await ws.send(json.dumps({
                "type": "heartbeat",
                "role": "agent",
                "token": TOKEN
            }))
            await asyncio.sleep(5)

    async def listen(self):
        while self.running:
            try:
                async with websockets.connect(URL) as ws:
                    await self.send_log(ws, "info", "Agent conectado")

                    await ws.send(json.dumps({
                        "type": "hello",
                        "role": "agent",
                        "token": TOKEN
                    }))

                    asyncio.create_task(self.heartbeat(ws))

                    while self.running:
                        message = await ws.recv()
                        data = json.loads(message)

                        if data.get("type") != "command":
                            continue

                        feedback = self.execute(data.get("action"), data)

                        await self.send_log(
                            ws,
                            "success" if feedback["status"] == "success" else "error",
                            feedback["message"]
                        )

                        await ws.send(json.dumps({
                            "type": "feedback",
                            "role": "agent",
                            **feedback
                        }))

            except Exception as e:
                print("⚠️ Erro de conexão:", e)
                await asyncio.sleep(5)  # retry


agent = Agent()
signal.signal(signal.SIGTERM, agent.shutdown)
signal.signal(signal.SIGINT, agent.shutdown)

asyncio.run(agent.listen())
