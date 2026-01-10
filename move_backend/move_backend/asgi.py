"""
ASGI config for move_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'move_backend.settings')

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from provider_service.consumers import RideNotificationConsumer
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'move_backend.settings')

application = ProtocolTypeRouter({
	"http": get_asgi_application(),
	"websocket": AuthMiddlewareStack(
		URLRouter([
			path("ws/ride-notifications/", RideNotificationConsumer.as_asgi()),
		])
	),
})
