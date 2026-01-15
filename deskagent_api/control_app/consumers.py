import json
from channels.generic.websocket import AsyncWebsocketConsumer
import time

class ControlConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.group_name = "control_group"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        print("📱 Cliente conectado")

   

    async def receive(self, text_data):
        data = json.loads(text_data)
        print("Recebido:", data)
        msg_type = data.get("type")
        
        # 🔹 HEARTBEAT DO AGENT
        if msg_type == "heartbeat":
            await self.channel_layer.group_send(
                self.group_name,
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
        if msg_type == "command" and data.get("role") == "app":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "broadcast_message",
                    "message": data
                }
            )
            return

    async def broadcast_message(self, event):
        await self.send(json.dumps(event["message"]))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        print("❌ Cliente desconectado")
