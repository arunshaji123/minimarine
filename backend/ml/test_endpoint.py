import requests
import json

print("Testing AI server endpoints...")
print("=" * 60)

# Test 1: Health endpoint
try:
    response = requests.get('http://localhost:5001/api/ai/health')
    print(f"✅ Health endpoint: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"❌ Health endpoint failed: {e}")

print()

# Test 2: Save results endpoint
try:
    test_data = {
        'surveyId': '507f1f77bcf86cd799439011',  # Test ID
        'results': [{'test': 'data'}],
        'summary': {'totalImages': 1}
    }
    response = requests.post(
        'http://localhost:5001/api/ai/save-results',
        json=test_data,
        headers={'Content-Type': 'application/json'}
    )
    print(f"📥 Save results endpoint: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"❌ Save results endpoint failed: {e}")

print("=" * 60)
