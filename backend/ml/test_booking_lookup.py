from pymongo import MongoClient
from bson import ObjectId

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['marine_survey_db']
bookings = db['surveyorbookings']
surveys = db['surveys']

booking_id = '69705016f60f66f0964663f1'

print(f"Testing booking lookup for ID: {booking_id}")
print("=" * 60)

# Try to find booking
try:
    booking = bookings.find_one({'_id': ObjectId(booking_id)})
    if booking:
        print("✅ BOOKING FOUND!")
        print(f"   Vessel Name: {booking.get('vesselName')}")
        print(f"   Surveyor ID: {booking.get('surveyor')}")
        print(f"   Vessel ID: {booking.get('vessel')}")
        print(f"   Survey Type: {booking.get('surveyType')}")
        print(f"   Status: {booking.get('status')}")
    else:
        print("❌ Booking not found")
except Exception as e:
    print(f"❌ Error looking up booking: {e}")

print("\n" + "=" * 60)
print("Recent surveys with AI analysis:")
ai_surveys = surveys.find({'aiAnalysis.analyzed': True}).sort('_id', -1).limit(3)
for survey in ai_surveys:
    print(f"  • {survey['_id']} - {survey.get('title')} - Status: {survey.get('status')}")
    print(f"    Surveyor: {survey.get('surveyor', 'N/A')}, Vessel: {survey.get('vessel', 'N/A')}")
