import requests

print("Testing /api/surveys/completed endpoint...")
print("=" * 70)

# Get token from localStorage (if exists)
# Since we don't have it, let's try without auth first
try:
    response = requests.get('http://localhost:5000/api/surveys/completed')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nTotal surveys returned: {len(data)}")
        for survey in data:
            print(f"  • {survey.get('_id')} - {survey.get('title')}")
            print(f"    Has aiAnalysis: {'aiAnalysis' in survey}")
    elif response.status_code == 401:
        print("\n⚠️  AUTHENTICATION REQUIRED!")
        print("The user needs to be logged in to see surveys.")
    elif response.status_code == 403:
        print("\n⚠️  FORBIDDEN!")
        print("The user doesn't have permission to view surveys.")
        
except Exception as e:
    print(f"❌ Error: {e}")
