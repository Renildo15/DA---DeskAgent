import json
from channels.generic.websocket import AsyncWebsocketConsumer
import time

from django.conf import settings


APP_GROUP = "control_app_group"
AGENT_GROUP = "control_agent_group"

INFO_APP_GROUP = "info_app_group"
INFO_AGENT_GROUP = "info_agent_group"

RATE_LIMIT_SECONDS = 2
last_comands_time = {}
class ControlConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        await self.accept()
        self.role = None
        print("📱 Websocket conectado")


    async def handle_handshake(self, data):
        role = data.get("role")

        if role == "app":
            self.role = "app"
            await self.channel_layer.group_add(
                APP_GROUP,
                self.channel_name
            )

            print("APP registrado")

        elif role == "agent":
            token = data.get("token")
            if token != settings.AGENT_TOKEN:
                await self.send_error("Token inválido")
                await self.close()
                return
            self.role = "agent"
            await self.channel_layer.group_add(
                AGENT_GROUP,
                self.channel_name
            )
            print("AGENT registrado")

    async def handle_heartbeat(self):
        if self.role != "agent":
            return
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

    async def handle_command(self, data):
        if self.role != "app":
            return

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

    async def handle_feedback(self, data):
        if self.role != "agent":
            return
        
        await self.channel_layer.group_send(
            APP_GROUP,
            {
                "type": "broadcast_message",
                "message": data
            }
        )

    async def handle_log(self, data):
        await self.channel_layer.group_send(
            "control_app_group",
            {
                "type": "broadcast_message",
                "message": data
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")

        if msg_type == "hello":
            await self.handle_handshake(data)
            return
        
        if not self.role:
            await self.send_error("Handshake não realizado!")
            return
        
        # 🔹 HEARTBEAT DO AGENT
        if msg_type == "heartbeat":
            await self.handle_heartbeat()
            return

        # 🔹 COMANDO VINDO DO APP
        if msg_type == "command":
            await self.handle_command(data)
            return
        
        # 🔹 FEEDBACK DO AGENT → REPASSA PARA O APP
        if msg_type == "feedback":
            await self.handle_feedback(data)
            return

        # 🔹 LOG DO AGENT → APP
        if msg_type == "log":
           await self.handle_log(data)
           return


    async def broadcast_message(self, event):
        await self.send(json.dumps(event["message"]))

    async def send_error(self, message):
        await self.send(json.dumps({
            "type": "feedback",
            "status": "error",
            "message": message
        }))

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


class PCInfoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.role = None
        print("📱 PC Info Websocket conectado")

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")
        role = data.get("role")

        if msg_type == "hello":
            if role == "app":
                self.role = "app"
                await self.channel_layer.group_add(
                    INFO_APP_GROUP,
                    self.channel_name
                )
                print("PC INFO APP registrado")
            elif role == "agent":
                self.role = "agent"
                await self.channel_layer.group_add(
                    INFO_AGENT_GROUP,
                    self.channel_name
                )
                print("PC INFO AGENT registrado")
            return
        
        if msg_type == "heartbeat":
            if self.role != "agent":
                return
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

        
        if msg_type == "pc_info" and self.role == "agent":
            await self.channel_layer.group_send(
                INFO_APP_GROUP,
                {
                    "type": "broadcast_message",
                    "message": data
                }
            )

    async def broadcast_message(self, event):
        await self.send(json.dumps(event["message"]))

    async def disconnect(self, close_code):
        if self.role == "app":
            await self.channel_layer.group_discard(
                INFO_APP_GROUP,
                self.channel_name
            )
        elif self.role == "agent":
            await self.channel_layer.group_discard(
                INFO_AGENT_GROUP,
                self.channel_name
            )

        print("❌ PC Info Websocket desconectado")