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

    def __str__(self):
        return f"{self.name} ({self.division.name if self.division else 'No Division'})"
