from django.core.management.base import BaseCommand
from logistics.models import LogisticsItem, LogisticsItemCategory, Accommodation, AccommodationType, AccommodationRoomType, AccommodationClassroomType, Transport, TransportType

class Command(BaseCommand):
    help = 'Seeds initial test data for the Logistics Management system'

    def handle(self, *args, **options):
        self.stdout.write('Seeding logistics items, accommodations, and transports...')

        # 1. Seed Stationary Items
        stationary_items = [
            {'name': 'Whiteboard Markers (Pack of 4)', 'quantity': 150, 'unit_cost': 5.50},
            {'name': 'A4 Paper Reams (80GSM)', 'quantity': 250, 'unit_cost': 4.75},
            {'name': 'Participant Notebooks', 'quantity': 500, 'unit_cost': 2.20},
            {'name': 'Gel Pens (Blue/Black)', 'quantity': 1000, 'unit_cost': 0.35},
            {'name': 'Post-it Sticky Notes', 'quantity': 300, 'unit_cost': 1.10},
            {'name': 'Flipchart Board Paper', 'quantity': 80, 'unit_cost': 8.50},
        ]

        for item_data in stationary_items:
            obj, created = LogisticsItem.objects.get_or_create(
                name=item_data['name'],
                category=LogisticsItemCategory.STATIONARY,
                defaults={
                    'quantity': item_data['quantity'],
                    'unit_cost': item_data['unit_cost']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created stationary item: {obj.name}"))
            else:
                self.stdout.write(f"Stationary item already exists: {obj.name}")

        # 2. Seed IT Logistics Items
        it_items = [
            {'name': 'Lenovo ThinkPad Developer Laptop', 'quantity': 45, 'unit_cost': 950.00},
            {'name': 'Epson Full HD Projector', 'quantity': 12, 'unit_cost': 480.00},
            {'name': 'TP-Link Deco E4 Mesh Router', 'quantity': 20, 'unit_cost': 65.00},
            {'name': 'HDMI to USB-C Adapters', 'quantity': 60, 'unit_cost': 12.50},
            {'name': 'Power Extension Board (5-Port)', 'quantity': 50, 'unit_cost': 15.00},
            {'name': 'Logitech Wireless Presenter Remote', 'quantity': 15, 'unit_cost': 25.00},
        ]

        for item_data in it_items:
            obj, created = LogisticsItem.objects.get_or_create(
                name=item_data['name'],
                category=LogisticsItemCategory.IT,
                defaults={
                    'quantity': item_data['quantity'],
                    'unit_cost': item_data['unit_cost']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created IT asset: {obj.name}"))
            else:
                self.stdout.write(f"IT asset already exists: {obj.name}")

        # 3. Seed Accommodations
        accommodations = [
            {
                'name': 'Dhaka Central Hub & Inn',
                'location': 'Dhaka > Dhaka > Gazipur Sadar',
                'type': AccommodationType.HOTEL,
                'room_type': AccommodationRoomType.SINGLE,
                'room_unit_cost': 85.00,
                'classroom_type': AccommodationClassroomType.CONFERENCE_ROOM,
                'classroom_unit_cost': 250.00,
                'has_wifi': True,
                'has_projector': True,
                'has_whiteboard': True,
                'has_dining': True
            },
            {
                'name': 'Sylhet IT Fellowship Dorm',
                'location': 'Sylhet > Sylhet > Fenchuganj',
                'type': AccommodationType.TRAINING_CENTER,
                'room_type': AccommodationRoomType.TWIN_SHARE,
                'room_unit_cost': 30.00,
                'classroom_type': AccommodationClassroomType.STD_CLASSROOM,
                'classroom_unit_cost': 90.00,
                'has_wifi': True,
                'has_projector': True,
                'has_whiteboard': True,
                'has_dining': False
            },
            {
                'name': 'Chattogram Sea Breeze Resort',
                'location': 'Chattogram > Chattogram > Anwara',
                'type': AccommodationType.HOTEL,
                'room_type': AccommodationRoomType.SUITE,
                'room_unit_cost': 175.00,
                'classroom_type': AccommodationClassroomType.CONFERENCE_ROOM,
                'classroom_unit_cost': 350.00,
                'has_wifi': True,
                'has_projector': True,
                'has_whiteboard': False,
                'has_dining': True
            },
            {
                'name': 'Rajshahi Digital Academy',
                'location': 'Rajshahi > Rajshahi > Paba',
                'type': AccommodationType.TRAINING_CENTER,
                'room_type': AccommodationRoomType.SINGLE,
                'room_unit_cost': 45.00,
                'classroom_type': AccommodationClassroomType.STD_CLASSROOM,
                'classroom_unit_cost': 80.00,
                'has_wifi': True,
                'has_projector': False,
                'has_whiteboard': True,
                'has_dining': True
            }
        ]

        for acc_data in accommodations:
            obj, created = Accommodation.objects.get_or_create(
                name=acc_data['name'],
                defaults=acc_data
            )
            if not created:
                obj.location = acc_data.get('location', '')
                obj.type = acc_data['type']
                obj.room_type = acc_data['room_type']
                obj.room_unit_cost = acc_data['room_unit_cost']
                obj.classroom_type = acc_data['classroom_type']
                obj.classroom_unit_cost = acc_data['classroom_unit_cost']
                obj.has_wifi = acc_data['has_wifi']
                obj.has_projector = acc_data['has_projector']
                obj.has_whiteboard = acc_data['has_whiteboard']
                obj.has_dining = acc_data['has_dining']
                obj.save()
                self.stdout.write(f"Updated existing accommodation register: {obj.name}")
            else:
                self.stdout.write(self.style.SUCCESS(f"Created accommodation register: {obj.name}"))

        # 4. Seed Transports
        transports = [
            {'name': 'Coaster Bus (Blue Fleet #1)', 'type': TransportType.BUS, 'capacity': 30, 'unit_cost': 140.00},
            {'name': 'Coaster Bus (Blue Fleet #2)', 'type': TransportType.BUS, 'capacity': 30, 'unit_cost': 140.00},
            {'name': 'VIP Microbus (Silver-Class)', 'type': TransportType.MICROBUS, 'capacity': 10, 'unit_cost': 75.00},
            {'name': 'Support Sedan (Toyota Fielder)', 'type': TransportType.CAR, 'capacity': 4, 'unit_cost': 35.00},
            {'name': 'Executive Sedan (Toyota Camry)', 'type': TransportType.CAR, 'capacity': 4, 'unit_cost': 60.00},
        ]

        for trans_data in transports:
            obj, created = Transport.objects.get_or_create(
                name=trans_data['name'],
                defaults=trans_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created transport asset: {obj.name}"))
            else:
                self.stdout.write(f"Transport asset already exists: {obj.name}")

        self.stdout.write(self.style.SUCCESS('Logistics database seeding completed successfully.'))
