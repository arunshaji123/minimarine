from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['marine_survey_db']
surveys = db['surveys']

# Fix the survey missing completionDate
survey_id = '69a5829603130429de9a95c4'

print(f"Fixing survey {survey_id}...")
result = surveys.update_one(
    {'_id': ObjectId(survey_id)},
    {'$set': {'completionDate': datetime.now()}}
)

if result.modified_count > 0:
    print("✅ Added completionDate")
else:
    print("⚠️ Already had completionDate")

# Now check what the query returns
print("\n" + "=" * 70)
print("Testing backend query (status: Completed, sorted by completionDate):")
print("=" * 70)

# This is what the backend does
query = {'status': 'Completed'}
result_surveys = surveys.find(query).sort('completionDate', -1).limit(10)

count = 0
for survey in result_surveys:
    count += 1
    has_ai = 'aiAnalysis' in survey and survey.get('aiAnalysis', {}).get('analyzed', False)
    print(f"\n{count}. {survey['_id']} - {survey.get('title')}")
    print(f"   Surveyor: {survey.get('surveyor', 'NONE')}")
    print(f"   AI Analysis: {has_ai}")
    print(f"   Completion Date: {survey.get('completionDate', 'NONE')}")
