from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017/')
db = client['marine_survey_db']
surveys = db['surveys']
users = db['users']

print("Finding surveyor IDs...")
print("=" * 60)

# Find any survey with a surveyor
sample_survey = surveys.find_one({'surveyor': {'$exists': True}})
if sample_survey:
    surveyor_id = sample_survey.get('surveyor')
    print(f"Found surveyor ID in surveys: {surveyor_id}")
else:
    print("No surveys with surveyor field found")

# List all surveyors
print("\nAll users with surveyor role:")
surveyors = users.find({'role': 'surveyor'})
for surveyor in surveyors:
    print(f"  • {surveyor['_id']} - {surveyor.get('name', 'N/A')} ({surveyor.get('email', 'N/A')})")
    
    # Update the AI survey with this surveyor
    print(f"\n  Updating AI survey with this surveyor...")
    result = surveys.update_one(
        {'_id': ObjectId('69a5829603130429de9a95c4')},
        {'$set': {'surveyor': surveyor['_id']}}
    )
    if result.modified_count > 0:
        print(f"  ✅ Survey updated with surveyor {surveyor.get('name')}")
    break
