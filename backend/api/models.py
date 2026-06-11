from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    # Add any extra fields if needed, like phone_number
    phone_number = models.CharField(max_length=20, blank=True, null=True)

class City(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lon = models.FloatField(null=True, blank=True)
    image = models.ImageField(upload_to='cities/', null=True, blank=True)

    def __str__(self):
        return self.name

class CityImage(models.Model):
    city = models.ForeignKey(City, related_name='gallery', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='cities/gallery/')

class Hotel(models.Model):
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    city = models.ForeignKey(City, related_name='hotels', on_delete=models.CASCADE, null=True, blank=True)
    location = models.CharField(max_length=255, db_index=True)
    lat = models.FloatField(null=True, blank=True)
    lon = models.FloatField(null=True, blank=True)
    rate = models.FloatField(default=0.0)
    reviews = models.IntegerField(default=0)
    image = models.ImageField(upload_to='hotels/', null=True, blank=True)

    def __str__(self):
        return self.title

class Room(models.Model):
    hotel = models.ForeignKey(Hotel, related_name='rooms', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    rate = models.FloatField(default=0.0)
    image = models.ImageField(upload_to='rooms/', null=True, blank=True)
    available_from = models.DateField(null=True, blank=True)
    available_to = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.hotel.title} - {self.title}"

class Booking(models.Model):
    user = models.ForeignKey(User, related_name='bookings', on_delete=models.CASCADE, db_index=True)
    room = models.ForeignKey(Room, related_name='bookings', on_delete=models.CASCADE, db_index=True)
    check_in_date = models.DateField(db_index=True)
    check_out_date = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    payment_screenshot = models.ImageField(upload_to='payments/')
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    booking_code = models.UUIDField(default=uuid.uuid4, editable=False)

    def __str__(self):
        return f"{self.user.username} - {self.room.title}"
