from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017/')
db = client['marine_survey_db']
surveys = db['surveys']

# Your surveyor ID (from the backend logs)
surveyor_id = ObjectId('68fa5e37867a4ed231bc36e1')  # survey2@gmail.com

print("Adding surveyor to AI surveys...")
print("=" * 70)

# Find all AI surveys without a surveyor
ai_surveys = surveys.find({
    'aiAnalysis.analyzed': True,
    'surveyor': {'$exists': False}
})

count = 0
for survey in ai_surveys:
    count += 1
    print(f"\n{count}. Updating survey {survey['_id']}")
    print(f"   Title: {survey.get('title')}")
    
    # Update with surveyor ID
    surveys.update_one(
        {'_id': survey['_id']},
        {'$set': {'surveyor': surveyor_id}}
    )
    print(f"   ✅ Added surveyor {surveyor_id}")

print(f"\n{'=' * 70}")
print(f"Total AI surveys updated: {count}")
