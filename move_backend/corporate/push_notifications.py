import requests
from django.conf import settings
from corporate.models import Driver, Customer

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

def send_push_notification(token, title, message, data=None):
    if not token:
        return False
    payload = {
        "to": token,
        "sound": "default",
        "title": title,
        "body": message,
        "data": data or {},
    }
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(EXPO_PUSH_URL, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Expo push notification error: {e}")
        return False

def notify_driver_push(driver_id, title, message, data=None):
    try:
        driver = Driver.objects.get(id=driver_id)
        if driver.expo_push_token:
            return send_push_notification(driver.expo_push_token, title, message, data)
    except Driver.DoesNotExist:
        pass
    return False

def notify_customer_push(customer_id, title, message, data=None):
    try:
        customer = Customer.objects.get(id=customer_id)
        if customer.expo_push_token:
            return send_push_notification(customer.expo_push_token, title, message, data)
    except Customer.DoesNotExist:
        pass
    return False

def notify_all_customers_push(title, message, data=None):
    tokens = Customer.objects.exclude(expo_push_token__isnull=True).exclude(expo_push_token='').values_list('expo_push_token', flat=True)
    for token in tokens:
        send_push_notification(token, title, message, data)

def notify_all_drivers_push(title, message, data=None):
    tokens = Driver.objects.exclude(expo_push_token__isnull=True).exclude(expo_push_token='').values_list('expo_push_token', flat=True)
    for token in tokens:
        send_push_notification(token, title, message, data)
