from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer
from django.shortcuts import get_object_or_404

class WalletDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet = get_object_or_404(Wallet, customer=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

class AddCreditView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        wallet = get_object_or_404(Wallet, customer=request.user)
        amount = request.data.get('amount')
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        wallet.balance += amount
        wallet.save()
        Transaction.objects.create(wallet=wallet, type='credit', amount=amount, desc='Added via API')
        return Response({'success': True, 'balance': wallet.balance})

class TransactionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        wallet = get_object_or_404(Wallet, customer=self.request.user)
        return Transaction.objects.filter(wallet=wallet).order_by('-date')
