from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def notify_driver(driver_id, data):
    channel_layer = get_channel_layer()
    group_name = f"driver_{driver_id}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {"type": "send_ride_notification", "data": data}
    )

def notify_customer(customer_id, data):
    channel_layer = get_channel_layer()
    group_name = f"customer_{customer_id}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {"type": "send_ride_notification", "data": data}
    )
