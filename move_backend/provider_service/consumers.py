import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models_ride_request import RideRequest
from corporate.models import Driver, Customer

class RideNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user.is_authenticated:
            # Group by user type and ID
            if hasattr(user, "is_online"):
                # Driver
                group_name = f"driver_{user.id}"
            else:
                # Customer
                group_name = f"customer_{user.id}"
            await self.channel_layer.group_add(group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        user = self.scope["user"]
        if user.is_authenticated:
            if hasattr(user, "is_online"):
                group_name = f"driver_{user.id}"
            else:
                group_name = f"customer_{user.id}"
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def receive(self, text_data):
        # Optionally handle incoming messages
        pass

    async def send_ride_notification(self, event):
        await self.send(text_data=json.dumps(event["data"]))
