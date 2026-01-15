from django.urls import re_path
from .consumers import ControlConsumer

websocket_urlpatterns = [
    re_path(r"ws/control/$", ControlConsumer.as_asgi()),
]
