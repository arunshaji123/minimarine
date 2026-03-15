from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017/')
db = client['marine_survey_db']
surveys = db['surveys']

# Fix the survey that was just created
survey_id = '69a5829603130429de9a95c4'

print(f"Fixing survey {survey_id}...")

result = surveys.update_one(
    {'_id': ObjectId(survey_id)},
    {'$set': {
        'status': 'Completed',
        'title': 'AI Damage Analysis Report'
    }}
)

if result.modified_count > 0:
    print("✅ Survey updated successfully!")
    print("\nUpdated survey:")
    survey = surveys.find_one({'_id': ObjectId(survey_id)})
    print(f"   Title: {survey.get('title')}")
    print(f"   Status: {survey.get('status')}")
    print(f"   AI Analysis: {survey.get('aiAnalysis', {}).get('analyzed', False)}")
    print(f"   Total Images: {survey.get('aiAnalysis', {}).get('totalImages', 0)}")
else:
    print("❌ Survey not found or already updated")
