"""
Ship Damage Detection API
Uses CNN/Deep Learning to detect damages in ship images
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import base64
import os
import logging
import traceback
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'ship_damage_model.pth')
DAMAGE_CLASSES = ['Rust', 'Crack', 'Corrosion', 'Dent', 'Clean']

# Global model variable
model = None

def load_model():
    """Load the trained PyTorch model"""
    global model
    try:
        if os.path.exists(MODEL_PATH):
            logger.info(f"Loading model from {MODEL_PATH}")
            model = torch.load(MODEL_PATH, map_location=torch.device('cpu'), weights_only=False)
            model.eval()
            logger.info("Model loaded successfully")
            return True
        else:
            logger.warning(f"Model file not found at {MODEL_PATH}")
            logger.warning("API will use mock predictions until model is trained")
            return False
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return False

# Image preprocessing pipeline
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def preprocess_image(image_file):
    """Preprocess image for model input"""
    img = Image.open(image_file).convert('RGB')
    img_tensor = transform(img).unsqueeze(0)
    return img_tensor

def predict_damage(img_tensor):
    """Predict damage type using the trained model"""
    if model is None:
        import random
        damage_idx = random.randint(0, len(DAMAGE_CLASSES) - 1)
        confidence = random.uniform(0.65, 0.95)
        return DAMAGE_CLASSES[damage_idx], confidence
    
    try:
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            return DAMAGE_CLASSES[predicted.item()], float(confidence.item())
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise

def determine_severity(damage_type, confidence):
    """Determine damage severity"""
    if damage_type == 'Clean':
        return 'None'
    if confidence >= 0.85:
        return 'High'
    elif confidence >= 0.70:
        return 'Medium'
    else:
        return 'Low'

def get_location_estimate(damage_type, image_type):
    """Estimate damage location"""
    import random
    location_map = {
        'Hull': ['Port Side', 'Starboard Side', 'Center Hull'],
        'Deck': ['Forward Deck', 'Main Deck', 'Aft Deck'],
        'Bow': ['Bow Section', 'Anchor Area'],
        'Stern': ['Stern Section', 'Rudder Area'],
        'General': ['Forward', 'Midship', 'Aft']
    }
    locations = location_map.get(image_type, location_map['General'])
    return random.choice(locations)

@app.route('/api/ai/analyze-images', methods=['POST'])
def analyze_images():
    """Analyze multiple ship images for damage detection"""
    try:
        logger.info(f"📸 Analysis request received")
        
        if 'images' not in request.files:
            return jsonify({'success': False, 'error': 'No images provided'}), 400
        
        files = request.files.getlist('images')
        image_types = request.form.getlist('imageTypes')
        survey_id = request.form.get('surveyId', None)
        
        logger.info(f"Analyzing {len(files)} images")
        
        results = []
        
        for idx, file in enumerate(files):
            try:
                image_type = image_types[idx] if idx < len(image_types) else 'General'
                img_tensor = preprocess_image(file)
                damage_type, confidence = predict_damage(img_tensor)
                has_damage = damage_type != 'Clean'
                severity = determine_severity(damage_type, confidence)
                location = get_location_estimate(damage_type, image_type) if has_damage else 'N/A'
                
                result = {
                    'imageId': f"{idx}_{int(datetime.now().timestamp() * 1000)}",
                    'imageName': file.filename,
                    'imageType': image_type,
                    'damageDetected': has_damage,
                    'damageType': damage_type if has_damage else None,
                    'confidence': round(confidence * 100, 2),
                    'severity': severity,
                    'location': location,
                    'timestamp': datetime.now().isoformat()
                }
                
                results.append(result)
                logger.info(f"Image {idx + 1}/{len(files)}: {file.filename} - {damage_type} ({confidence:.2%})")
                
            except Exception as e:
                logger.error(f"Error processing {file.filename}: {str(e)}")
                results.append({'imageName': file.filename, 'error': str(e)})
        
        return jsonify({
            'success': True,
            'results': results,
            'summary': {
                'totalImages': len(results),
                'damagesDetected': sum(1 for r in results if r.get('damageDetected', False)),
                'cleanImages': sum(1 for r in results if not r.get('damageDetected', False))
            },
            'modelStatus': 'trained' if model else 'mock'
        })
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ai/save-results', methods=['POST'])
def save_results():
    """Save AI analysis results to MongoDB"""
    try:
        data = request.json
        survey_id = data.get('surveyId')
        results = data.get('results', [])
        summary = data.get('summary', {})
        surveyor_id = data.get('surveyorId')  # Get surveyor ID from request
        
        logger.info(f"💾 Saving AI results (ID: {survey_id}, Surveyor: {surveyor_id})")
        
        if not survey_id:
            return jsonify({'success': False, 'error': 'Survey ID required'}), 400
        
        # Import MongoDB
        from pymongo import MongoClient
        from bson import ObjectId
        
        # Connect to MongoDB Atlas (same as backend)
        MONGODB_URI = 'mongodb+srv://arun:arun@cluster0.hgwppct.mongodb.net/marine_survey?retryWrites=true&w=majority&appName=Cluster0'
        client = MongoClient(MONGODB_URI)
        db = client['marine_survey']  # Database name is 'marine_survey' not 'marine_survey_db'
        surveys = db['surveys']
        bookings = db['surveyorbookings']
        
        logger.info("✅ Connected to MongoDB")
        
        # Prepare AI analysis
        ai_analysis = {
            'analyzed': True,
            'analysisDate': datetime.now().isoformat(),
            'totalImages': summary.get('totalImages', len(results)),
            'damagesDetected': summary.get('damagesDetected', 0),
            'cleanImages': summary.get('cleanImages', 0),
            'results': results,
            'modelVersion': 'ResNet18-v1.0',
            'modelStatus': 'trained' if model else 'mock',
            'sourceId': survey_id
        }
        
        # Try to update existing survey or create from booking
        try:
            survey = surveys.find_one({'_id': ObjectId(survey_id)})
            
            if survey:
                # Update existing survey
                surveys.update_one(
                    {'_id': ObjectId(survey_id)},
                    {'$set': {'aiAnalysis': ai_analysis, 'updatedAt': datetime.now()}}
                )
                logger.info(f"✅ Updated survey {survey_id}")
            else:
                # ID might be a booking ID - try to find the booking
                logger.info(f"Survey not found, checking if {survey_id} is a booking...")
                booking = bookings.find_one({'_id': ObjectId(survey_id)})
                
                if booking:
                    logger.info(f"✅ Found booking: {booking.get('vesselName', 'Unknown')}")
                    # Create survey from booking
                    new_survey = {
                        'title': f"AI Damage Analysis - {booking.get('vesselName', 'Unknown Ship')}",
                        'surveyType': booking.get('surveyType', 'Other'),
                        'status': 'Completed',  # Mark as completed so it shows in reports
                        'vessel': booking.get('vessel'),
                        'surveyor': booking.get('surveyor'),
                        'inspectionDate': booking.get('inspectionDate', datetime.now()),
                        'completionDate': datetime.now(),
                        'aiAnalysis': ai_analysis,
                        'sourceBookingId': survey_id,
                        'createdAt': datetime.now(),
                        'updatedAt': datetime.now()
                    }
                    result = surveys.insert_one(new_survey)
                    survey_id = str(result.inserted_id)
                    logger.info(f"✅ Created survey from booking: {survey_id}")
                else:
                    # Neither survey nor booking found - create minimal survey
                    logger.warning(f"No booking or survey found for {survey_id}, creating minimal survey")
                    new_survey = {
                        'title': 'AI Damage Analysis Report',
                        'surveyType': 'Other',
                        'status': 'Completed',
                        'aiAnalysis': ai_analysis,
                        'sourceBookingId': survey_id,
                        'createdAt': datetime.now(),
                        'updatedAt': datetime.now(),
                        'completionDate': datetime.now()
                    }
                    # Add surveyor if provided
                    if surveyor_id:
                        new_survey['surveyor'] = ObjectId(surveyor_id)
                        logger.info(f"Adding surveyor {surveyor_id} to new survey")
                    
                    result = surveys.insert_one(new_survey)
                    survey_id = str(result.inserted_id)
                    logger.info(f"✅ Created minimal survey {survey_id}")
            
            return jsonify({
                'success': True,
                'message': 'AI analysis saved successfully!',
                'analysisDate': ai_analysis['analysisDate'],
                'surveyId': survey_id
            })
            
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500
            
    except Exception as e:
        logger.error(f"Error saving results: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ai/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_path': MODEL_PATH,
        'damage_classes': DAMAGE_CLASSES,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    load_model()
    port = int(os.environ.get('AI_API_PORT', 5001))
    logger.info(f"Starting Ship Damage Detection API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
