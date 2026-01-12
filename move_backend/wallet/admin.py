from django.contrib import admin
from .models import Wallet, Transaction

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("customer", "balance")
    search_fields = ("customer__email", "customer__full_name")

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("wallet", "type", "amount", "date", "desc")
    list_filter = ("type", "date")
    search_fields = ("wallet__customer__email", "desc")
