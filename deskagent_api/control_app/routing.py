from django.urls import re_path, path
from .consumers import ControlConsumer, PCInfoConsumer

websocket_urlpatterns = [
    re_path(r"ws/control/$", ControlConsumer.as_asgi()),
    re_path(r"ws/pc_info/$", PCInfoConsumer.as_asgi()),
    path("", ControlConsumer.as_asgi()),
]
