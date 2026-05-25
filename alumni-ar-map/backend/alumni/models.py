from django.db import models
from geopy.geocoders import Nominatim

class Alumni(models.Model):
    name        = models.CharField(max_length=100)
    batch_year  = models.IntegerField()
    company     = models.CharField(max_length=100)
    city        = models.CharField(max_length=100)
    country     = models.CharField(max_length=100)
    photo       = models.ImageField(upload_to='alumni/', blank=True, null=True)
    latitude    = models.FloatField(blank=True, null=True)
    longitude   = models.FloatField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # Auto geocode on save
        if self.city and self.country:
            try:
                geolocator = Nominatim(user_agent="alumni-ar-map")
                location = geolocator.geocode(f"{self.city}, {self.country}")
                if location:
                    self.latitude = location.latitude
                    self.longitude = location.longitude
            except:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name