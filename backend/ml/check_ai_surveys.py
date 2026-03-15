from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['marine_survey_db']
surveys = db['surveys']

print("=" * 70)
print("ALL SURVEYS WITH AI ANALYSIS IN DATABASE:")
print("=" * 70)

ai_surveys = surveys.find({'aiAnalysis.analyzed': True}).sort('_id', -1)
count = 0

for survey in ai_surveys:
    count += 1
    print(f"\n{count}. Survey ID: {survey['_id']}")
    print(f"   Title: {survey.get('title', 'N/A')}")
    print(f"   Status: {survey.get('status', 'N/A')}")
    print(f"   Surveyor: {survey.get('surveyor', 'NOT SET (MISSING)')}")
    print(f"   Vessel: {survey.get('vessel', 'NOT SET')}")
    print(f"   AI Analysis Date: {survey.get('aiAnalysis', {}).get('analysisDate', 'N/A')}")
    print(f"   Total Images: {survey.get('aiAnalysis', {}).get('totalImages', 0)}")
    print(f"   Damages Detected: {survey.get('aiAnalysis', {}).get('damagesDetected', 0)}")
    print(f"   Has completionDate: {'completionDate' in survey}")
    if 'completionDate' in survey:
        print(f"   Completion Date: {survey['completionDate']}")

if count == 0:
    print("\n⚠️  NO AI SURVEYS FOUND IN DATABASE!")
    print("\nLet's check ALL surveys:")
    all_surveys = surveys.find().sort('_id', -1).limit(5)
    for survey in all_surveys:
        print(f"\n  • {survey['_id']} - {survey.get('title')} - Status: {survey.get('status')}")
        print(f"    Has aiAnalysis: {'aiAnalysis' in survey}")
else:
    print(f"\n{'=' * 70}")
    print(f"TOTAL AI SURVEYS FOUND: {count}")
