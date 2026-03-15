import requests

# Test the AI reports endpoint
url = "http://localhost:5000/api/surveys/ai-reports"

# Get token from existing session (you'll need to get this from browser)
# For now, test without auth to see if endpoint exists
try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Also test with MongoDB directly
print("\n" + "="*50)
print("Direct MongoDB Query:")
print("="*50)

from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb+srv://arun:arun@cluster0.hgwppct.mongodb.net/marine_survey?retryWrites=true&w=majority&appName=Cluster0')
db = client['marine_survey']
surveys_collection = db['surveys']

# Query for surveys with aiAnalysis.analyzed = true
ai_surveys = list(surveys_collection.find(
    {'aiAnalysis.analyzed': True}
).sort('completionDate', -1).limit(10))

print(f"\nFound {len(ai_surveys)} AI surveys")
for survey in ai_surveys:
    print(f"\n{survey['_id']} - {survey.get('title', 'No title')}")
    print(f"  Surveyor: {survey.get('surveyor', 'None')}")
    print(f"  AI Analysis: {survey.get('aiAnalysis', {}).get('analyzed', False)}")
    print(f"  Total Images: {survey.get('aiAnalysis', {}).get('totalImages', 0)}")
    print(f"  Damages: {survey.get('aiAnalysis', {}).get('damagesDetected', 0)}")
