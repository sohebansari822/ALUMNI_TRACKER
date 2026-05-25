from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Alumni
from .serializers import AlumniSerializer

class AlumniViewSet(viewsets.ModelViewSet):
    queryset = Alumni.objects.all()
    serializer_class = AlumniSerializer
    permission_classes = [AllowAny]