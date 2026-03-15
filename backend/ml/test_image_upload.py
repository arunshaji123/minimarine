"""
Test script to verify AI image analysis API works correctly
"""

import requests
from PIL import Image
import io
import os

def create_test_image(color, size=(500, 500)):
    """Create a simple test image"""
    img = Image.new('RGB', size, color=color)
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes

def test_api():
    """Test the AI API with sample images"""
    
    print("=" * 60)
    print("TESTING AI IMAGE ANALYSIS API")
    print("=" * 60)
    
    # Step 1: Test health endpoint
    print("\n1️⃣ Testing health endpoint...")
    try:
        response = requests.get("http://localhost:5001/api/ai/health")
        data = response.json()
        print(f"   ✅ Status: {data['status']}")
        print(f"   ✅ Model Loaded: {data['model_loaded']}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 2: Create test images
    print("\n2️⃣ Creating test images...")
    test_images = [
        ('rust_test.jpg', 'red', 'Hull'),
        ('crack_test.jpg', 'gray', 'Deck'),
        ('clean_test.jpg', 'lightblue', 'Bow')
    ]
    
    print(f"   ✅ Created {len(test_images)} test images")
    
    # Step 3: Test image analysis
    print("\n3️⃣ Testing image analysis...")
    try:
        # Prepare form data
        files = []
        form_data = {
            'imageTypes': [],
            'surveyId': 'TEST001'
        }
        
        for filename, color, image_type in test_images:
            img_bytes = create_test_image(color)
            files.append(('images', (filename, img_bytes, 'image/jpeg')))
            form_data['imageTypes'].append(image_type)
        
        # Send request
        response = requests.post(
            "http://localhost:5001/api/ai/analyze-images",
            files=files,
            data=form_data
        )
        
        print(f"   Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: {data['success']}")
            print(f"\n   📊 RESULTS:")
            print(f"      Total Images: {data['summary']['totalImages']}")
            print(f"      Damages Detected: {data['summary']['damagesDetected']}")
            print(f"      Clean Images: {data['summary']['cleanImages']}")
            print(f"      Model Status: {data['modelStatus']}")
            
            print(f"\n   📋 DETAILED RESULTS:")
            for idx, result in enumerate(data['results'], 1):
                print(f"\n      Image {idx}: {result['imageName']}")
                print(f"         Type: {result['imageType']}")
                print(f"         Damage: {result['damageType'] or 'None'}")
                print(f"         Confidence: {result['confidence']}%")
                print(f"         Severity: {result['severity']}")
                
            print("\n   ✅✅✅ IMAGE UPLOAD & ANALYSIS WORKING! ✅✅✅")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        print(traceback.format_exc())
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
