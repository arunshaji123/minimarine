from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb+srv://arun:arun@cluster0.hgwppct.mongodb.net/marine_survey?retryWrites=true&w=majority&appName=Cluster0')
db = client['marine_survey']
surveys_collection = db['surveys']

# Check the specific AI survey IDs we know exist
ai_survey_ids = [
    '69a5829603130429de9a95c4',
    '69a65fb474578857df84a3f6',
    '69a6570f454ab5e6ea06779c',
    '69a65685454ab5e6ea06779a'
]

print("Checking specific AI survey IDs:\n")
for survey_id in ai_survey_ids:
    try:
        survey = surveys_collection.find_one({'_id': ObjectId(survey_id)})
        if survey:
            print(f"\n{'='*60}")
            print(f"Survey ID: {survey_id}")
            print(f"Title: {survey.get('title', 'No title')}")
            print(f"Status: {survey.get('status', 'No status')}")
            
            # Check if aiAnalysis field exists
            if 'aiAnalysis' in survey:
                ai_data = survey['aiAnalysis']
                print(f"\n✅ aiAnalysis field EXISTS")
                print(f"Type: {type(ai_data)}")
                if isinstance(ai_data, dict):
                    print(f"Keys: {list(ai_data.keys())}")
                    print(f"analyzed field: {ai_data.get('analyzed', 'MISSING')}")
                    print(f"totalImages: {ai_data.get('totalImages', 'MISSING')}")
                    print(f"damagesDetected: {ai_data.get('damagesDetected', 'MISSING')}")
                else:
                    print(f"❌ aiAnalysis is not a dict, it's: {ai_data}")
            else:
                print(f"\n❌ aiAnalysis field DOES NOT EXIST")
        else:
            print(f"\n❌ Survey {survey_id} NOT FOUND")
    except Exception as e:
        print(f"\n❌ Error checking {survey_id}: {e}")

# Also check all surveys with title containing "AI Damage"
print(f"\n\n{'='*60}")
print("All surveys with 'AI Damage' in title:")
print('='*60)

ai_title_surveys = list(surveys_collection.find(
    {'title': {'$regex': 'AI Damage', '$options': 'i'}}
).limit(10))

print(f"\nFound {len(ai_title_surveys)} surveys with 'AI Damage' in title")
for survey in ai_title_surveys:
    print(f"\n{survey['_id']} - {survey.get('title')}")
    print(f"  Has aiAnalysis: {'aiAnalysis' in survey}")
    if 'aiAnalysis' in survey:
        print(f"  aiAnalysis type: {type(survey['aiAnalysis'])}")
        if isinstance(survey['aiAnalysis'], dict):
            print(f"  analyzed: {survey['aiAnalysis'].get('analyzed', 'MISSING')}")
