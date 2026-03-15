from pymongo import MongoClient

client = MongoClient('mongodb+srv://arun:arun@cluster0.hgwppct.mongodb.net/marine_survey?retryWrites=true&w=majority&appName=Cluster0')
db = client['marine_survey']
surveys_collection = db['surveys']

# Get total count
total = surveys_collection.count_documents({})
print(f"Total surveys in database: {total}")

# Get first 5 surveys, sorted by creation date
recent = list(surveys_collection.find().sort('createdAt', -1).limit(5))

print(f"\nMost recent 5 surveys:")
for survey in recent:
    print(f"\n{survey['_id']}")
    print(f"  Title: {survey.get('title', 'No title')}")
    print(f"  Status: {survey.get('status', 'No status')}")
    print(f"  Created: {survey.get('createdAt', 'Unknown')}")
    print(f"  Has aiAnalysis: {'aiAnalysis' in survey}")
    
# Check if any surveys have aiAnalysis field at all
surveys_with_ai = list(surveys_collection.find({'aiAnalysis': {'$exists': True}}).limit(5))
print(f"\n\nSurveys with aiAnalysis field: {len(surveys_with_ai)}")
if len(surveys_with_ai) > 0:
    for survey in surveys_with_ai:
        print(f"  {survey['_id']} - {survey.get('title')}")
