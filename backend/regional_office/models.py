from django.db import models

class Division(models.Model):
    name = models.CharField(max_length=100, unique=True)
    included_regions = models.JSONField(default=list)

    def __str__(self):
        return self.name

class RegionalOffice(models.Model):
    name = models.CharField(max_length=100)
    division = models.ForeignKey(
        Division,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='regional_offices'
    )
    location = models.CharField(max_length=255)
    regional_managers = models.ManyToManyField(
        'users.User',
        related_name='regional_offices',
        blank=True
    )

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.division.name if self.division else 'No Division'})"

    def save(self, *args, **kwargs):
        if not self.latitude or not self.longitude:
            DIVISION_COORDINATES = {
                'dhaka': (23.8103, 90.4125),
                'chattogram': (22.3569, 91.7832),
                'sylhet': (24.8949, 91.8687),
                'rajshahi': (24.3636, 88.6241),
                'khulna': (22.8456, 89.5403),
                'barishal': (22.7010, 90.3535),
                'rangpur': (25.7439, 89.2753),
                'mymensingh': (24.7471, 90.4203),
            }
            div_name = self.division.name.lower() if self.division else ''
            clean_div = div_name.replace('division', '').strip()
            if clean_div in DIVISION_COORDINATES:
                lat, lng = DIVISION_COORDINATES[clean_div]
                import random
                self.latitude = lat + random.uniform(-0.06, 0.06)
                self.longitude = lng + random.uniform(-0.06, 0.06)
        super().save(*args, **kwargs)
