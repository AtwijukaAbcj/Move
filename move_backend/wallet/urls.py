from django.urls import path
from .views import WalletDetailView, AddCreditView, TransactionListView

urlpatterns = [
    path('balance/', WalletDetailView.as_view(), name='wallet-balance'),
    path('add-credit/', AddCreditView.as_view(), name='wallet-add-credit'),
    path('transactions/', TransactionListView.as_view(), name='wallet-transactions'),
]
