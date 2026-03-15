import requests
import json
from datetime import datetime

# Test data to save
test_data = {
    'surveyId': 'test123',  # Fake ID
    'surveyorId': '68fa5e37867a4ed231bc36e1',  # Your surveyor ID
    'results': [
        {
            'imageName': 'test_bow.png',
            'damageType': 'Dent',
            'confidence': 85.5,
            'severity': 'Major',
            'location': 'Bow',
            'damageDetected': True
        }
    ],
    'summary': {
        'totalImages': 1,
        'damagesDetected': 1,
        'cleanImages': 0
    }
}

# Send to AI server
url = 'http://localhost:5001/api/ai/save-results'
headers = {'Content-Type': 'application/json'}

print("Testing AI save endpoint...")
print(f"URL: {url}")
print(f"Data: {json.dumps(test_data, indent=2)}")
print("\nSending request...")

try:
    response = requests.post(url, json=test_data, headers=headers)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ Save successful!")
        
        # Now check if it's in the database
        print("\nChecking database...")
        from pymongo import MongoClient
        
        client = MongoClient('mongodb+srv://arun:arun@cluster0.hgwppct.mongodb.net/marine_survey?retryWrites=true&w=majority&appName=Cluster0')
        db = client['marine_survey']
        surveys_collection = db['surveys']
        
        # Find the most recent survey
        recent_survey = surveys_collection.find_one(sort=[('_id', -1)])
        if recent_survey:
            print(f"\nMost recent survey:")
            print(f"  ID: {recent_survey['_id']}")
            print(f" Title: {recent_survey.get('title', 'No title')}")
            print(f"  Has aiAnalysis: {'aiAnalysis' in recent_survey}")
            if 'aiAnalysis' in recent_survey:
                print(f"  aiAnalysis.analyzed: {recent_survey['aiAnalysis'].get('analyzed')}")
                print(f"  aiAnalysis.totalImages: {recent_survey['aiAnalysis'].get('totalImages')}")
    else:
        print(f"\n❌ Save failed with status {response.status_code}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
