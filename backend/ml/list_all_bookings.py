from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017/')
db = client['marine_survey_db']
bookings = db['surveyorbookings']

print("All bookings in database:")
print("=" * 60)

all_bookings = bookings.find().limit(20)
count = 0
for booking in all_bookings:
    count += 1
    print(f"\n{count}. ID: {booking['_id']}")
    print(f"   Vessel: {booking.get('vesselName', 'N/A')}")
    print(f"   Status: {booking.get('status', 'N/A')}")
    print(f"   Surveyor: {booking.get('surveyor', 'N/A')}")

print(f"\n{'=' * 60}")
print(f"Total bookings found: {count}")
