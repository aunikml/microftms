from django.db import models

class LogisticsItemCategory(models.TextChoices):
    STATIONARY = 'stationary', 'Stationary'
    IT = 'it', 'IT Logistics'

class LogisticsItem(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50,
        choices=LogisticsItemCategory.choices,
        default=LogisticsItemCategory.STATIONARY
    )
    quantity = models.IntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    class Meta:
        verbose_name = "Logistics Item"
        verbose_name_plural = "Logistics Items"


class AccommodationType(models.TextChoices):
    TRAINING_CENTER = 'training_center', 'Training Center'
    HOTEL = 'hotel', 'Hotel'

class AccommodationRoomType(models.TextChoices):
    SUITE = 'suite', 'Suite'
    SINGLE = 'single', 'Single Accommodation'
    TWIN_SHARE = 'twin_share', 'Twin Share'

class AccommodationClassroomType(models.TextChoices):
    CONFERENCE_ROOM = 'conference_room', 'Conference Room'
    STD_CLASSROOM = 'std_classroom', 'Standard Classroom'

class Accommodation(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=100, blank=True, default='')
    type = models.CharField(
        max_length=50,
        choices=AccommodationType.choices,
        default=AccommodationType.TRAINING_CENTER
    )
    room_type = models.CharField(
        max_length=50,
        choices=AccommodationRoomType.choices,
        default=AccommodationRoomType.SINGLE
    )
    room_unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    classroom_type = models.CharField(
        max_length=50,
        choices=AccommodationClassroomType.choices,
        default=AccommodationClassroomType.STD_CLASSROOM
    )
    classroom_unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Available facilities represented as booleans (Wifi, Projector, Whiteboard, Dining)
    has_wifi = models.BooleanField(default=False)
    has_projector = models.BooleanField(default=False)
    has_whiteboard = models.BooleanField(default=False)
    has_dining = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

    class Meta:
        verbose_name = "Accommodation"
        verbose_name_plural = "Accommodations"


class TransportType(models.TextChoices):
    BUS = 'bus', 'Bus'
    MICROBUS = 'microbus', 'Microbus'
    CAR = 'car', 'Car'

class Transport(models.Model):
    name = models.CharField(max_length=255)
    type = models.CharField(
        max_length=50,
        choices=TransportType.choices,
        default=TransportType.BUS
    )
    capacity = models.IntegerField(default=4)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

    class Meta:
        verbose_name = "Transport"
        verbose_name_plural = "Transports"


class LogisticsRequest(models.Model):
    batch = models.ForeignKey('batches.Batch', on_delete=models.CASCADE, related_name='logistics_requests')
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Accommodation Fields
    accommodation = models.ForeignKey(Accommodation, on_delete=models.SET_NULL, null=True, blank=True)
    check_in_date = models.DateField(null=True, blank=True)
    check_out_date = models.DateField(null=True, blank=True)
    num_trainers = models.IntegerField(null=True, blank=True)
    
    # New processing fields for the logistics manager
    is_opened = models.BooleanField(default=False)
    stationary_status = models.CharField(max_length=20, default='pending')
    it_status = models.CharField(max_length=20, default='pending')
    accommodation_status = models.CharField(max_length=20, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Logistics Request for {self.batch.batch_name}"

    class Meta:
        verbose_name = "Logistics Request"
        verbose_name_plural = "Logistics Requests"


class LogisticsRequestItem(models.Model):
    request = models.ForeignKey(LogisticsRequest, on_delete=models.CASCADE, related_name='requested_items')
    item = models.ForeignKey(LogisticsItem, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

    class Meta:
        unique_together = ('request', 'item')
        verbose_name = "Logistics Request Item"
        verbose_name_plural = "Logistics Request Items"

    def __str__(self):
        return f"{self.quantity}x {self.item.name} for {self.request.batch.batch_name}"

