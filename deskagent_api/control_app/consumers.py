import json
from channels.generic.websocket import AsyncWebsocketConsumer
import time

from django.conf import settings


APP_GROUP = "control_app_group"
AGENT_GROUP = "control_agent_group"

RATE_LIMIT_SECONDS = 2
last_comands_time = {}
class ControlConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        await self.accept()
        self.role = None
        print("📱 Websocket conectado")


    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")




        if msg_type == "hello":
            role = data.get("role")

            if role == "app":
                self.role = "app"
                await self.channel_layer.group_add(
                    APP_GROUP,
                    self.channel_name
                )

                print("APP registrado")
                return
            elif role == "agent":
                token = data.get("token")
                if token != settings.AGENT_TOKEN:
                    print("Token inválido")
                    await self.send(json.dumps({
                        "type": "feedback",
                        "status": "error",
                        "message": "Token inválido"
                    }))
                    await self.close()
                    return
                print("AGENT registrado")
                self.role = "agent"
                await self.channel_layer.group_add(
                    AGENT_GROUP,
                    self.channel_name
                )
        
        # 🔹 HEARTBEAT DO AGENT
        if msg_type == "heartbeat" and self.role == "agent":
            await self.channel_layer.group_send(
                APP_GROUP,
                {
                    "type": "broadcast_message",
                    "message": {
                        "type": "status",
                        "online": True,
                        "timestamp": time.time()
                    }
                }
            )
            return

        # 🔹 COMANDO VINDO DO APP
        if msg_type == "command" and self.role == "app":
            now = time.time()
            last_time = last_comands_time.get(self.channel_name, 0)

            if now - last_time < RATE_LIMIT_SECONDS:
                await self.send(json.dumps({
                    "type": "feedback",
                    "status": "error",
                    "message": "Aguarde um pouco antes de enviar outro comando"
                }))

                return
            last_comands_time[self.channel_name] = now
            
            await self.channel_layer.group_send(
                AGENT_GROUP,
                {
                    "type": "broadcast_message",
                    "message": data
                }
            )
            return
        
        # 🔹 FEEDBACK DO AGENT → REPASSA PARA O APP
        if msg_type == "feedback" and self.role == "agent":
            await self.channel_layer.group_send(
                APP_GROUP,
                {
                    "type": "broadcast_message",
                    "message": data
                }
            )
            return

        # 🔹 LOG DO AGENT → APP
        if msg_type == "log":
            await self.channel_layer.group_send(
                "control_app_group",
                {
                    "type": "broadcast_message",
                    "message": data
                }
            )
            return


    async def broadcast_message(self, event):
        await self.send(json.dumps(event["message"]))

    async def disconnect(self, close_code):
        if self.role == "app":
            await self.channel_layer.group_discard(
                APP_GROUP,
                self.channel_name
            )
        elif self.role == "agent":
            await self.channel_layer.group_discard(
                AGENT_GROUP,
                self.channel_name
            )

        print("❌ Websocket desconectado")
