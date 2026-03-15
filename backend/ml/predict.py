"""
Prediction script for marine survey predictive maintenance
Loads trained model and generates predictions for a specific vessel
"""

import os
import sys
import json
import argparse
import numpy as np
import joblib
from pymongo import MongoClient
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import MONGODB_URI, MODEL_PATH, SCALER_PATH, COMPONENTS, COMPONENT_DISPLAY_NAMES, RISK_THRESHOLDS
from feature_extraction import extract_survey_features, extract_component_features


def load_model():
    """Load trained model and scaler"""
    if not os.path.exists(MODEL_PATH):
        return None, None, "Model not found. Please run train_model.py first."
    
    if not os.path.exists(SCALER_PATH):
        return None, None, "Scaler not found. Please run train_model.py first."
    
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        return model, scaler, None
    except Exception as e:
        return None, None, f"Error loading model: {str(e)}"


def get_vessel_surveys(db, vessel_id):
    """Fetch surveys for a specific vessel"""
    try:
        from bson.objectid import ObjectId
        
        # Convert string ID to ObjectId
        vessel_obj_id = ObjectId(vessel_id)
        
        # Get vessel info
        vessel = db.vessels.find_one({'_id': vessel_obj_id})
        if not vessel:
            return None, None, "Vessel not found"
        
        # Get completed surveys
        surveys = list(db.surveys.find({
            'vessel': vessel_obj_id,
            'status': 'Completed'
        }).sort('completionDate', -1))
        
        if len(surveys) == 0:
            return vessel, [], "No completed surveys found for this vessel"
        
        return vessel, surveys, None
    except Exception as e:
        return None, None, f"Error fetching vessel data: {str(e)}"


def calculate_component_risk_score(model, scaler, surveys, component_name, vessel_age):
    """
    Calculate risk score for a specific component
    Uses both overall model and component-specific heuristics
    """
    if not surveys:
        return 0.5  # Default medium risk
    
    latest_survey = surveys[0]
    
    # Get component rating
    rating = float(latest_survey.get(component_name, 3.0) or 3.0)
    
    # Calculate trend
    if len(surveys) >= 2:
        prev_rating = float(surveys[1].get(component_name, 3.0) or 3.0)
        trend = rating - prev_rating
    else:
        trend = 0.0
    
    # Days since last inspection
    completion_date = latest_survey.get('completionDate') or latest_survey.get('scheduledDate')
    if completion_date:
        if isinstance(completion_date, str):
            completion_date = datetime.fromisoformat(completion_date.replace('Z', '+00:00'))
        days_since = (datetime.now() - completion_date).days
    else:
        days_since = 90
    
    # Heuristic-based risk calculation
    base_risk = 0.5
    
    # Rating-based risk (lower rating = higher risk)
    if rating <= 1:
        base_risk = 0.95
    elif rating <= 2:
        base_risk = 0.80
    elif rating <= 3:
        base_risk = 0.60
    elif rating <= 4:
        base_risk = 0.35
    else:
        base_risk = 0.15
    
    # Trend adjustment (declining trend increases risk)
    if trend < -1:
        base_risk += 0.15
    elif trend < 0:
        base_risk += 0.05
    elif trend > 1:
        base_risk -= 0.10
    
    # Time-based risk (longer since last inspection = higher risk)
    if days_since > 180:
        base_risk += 0.15
    elif days_since > 90:
        base_risk += 0.05
    
    # Age-based risk
    if vessel_age > 20:
        base_risk += 0.10
    elif vessel_age > 15:
        base_risk += 0.05
    
    # Cap between 0 and 1
    return max(0.0, min(1.0, base_risk))


def generate_recommendation(component_name, risk_score, rating, trend):
    """Generate maintenance recommendation based on risk score"""
    if risk_score >= RISK_THRESHOLDS['critical']:
        return f"⚠ CRITICAL: Immediate inspection and maintenance required for {COMPONENT_DISPLAY_NAMES[component_name]}"
    elif risk_score >= RISK_THRESHOLDS['high']:
        return f"⚠ HIGH: Schedule inspection within 2 weeks for {COMPONENT_DISPLAY_NAMES[component_name]}"
    elif risk_score >= RISK_THRESHOLDS['medium']:
        return f"⚡ MEDIUM: Schedule inspection within 30 days for {COMPONENT_DISPLAY_NAMES[component_name]}"
    elif risk_score >= RISK_THRESHOLDS['low']:
        return f"✓ LOW: Monitor during regular maintenance cycle"
    else:
        return f"✓ GOOD: Component in good condition, continue regular monitoring"


def get_urgency_level(risk_score):
    """Determine urgency level from risk score"""
    if risk_score >= RISK_THRESHOLDS['critical']:
        return 'Critical'
    elif risk_score >= RISK_THRESHOLDS['high']:
        return 'High'
    elif risk_score >= RISK_THRESHOLDS['medium']:
        return 'Medium'
    elif risk_score >= RISK_THRESHOLDS['low']:
        return 'Low'
    else:
        return 'Very Low'


def predict_vessel_maintenance(vessel_id):
    """
    Generate predictions for a specific vessel
    Returns JSON output for API consumption
    """
    # Load model
    model, scaler, error = load_model()
    if error:
        return {'error': error}
    
    # Connect to database
    try:
        client = MongoClient(MONGODB_URI)
        db = client.get_default_database()
    except Exception as e:
        return {'error': f'Database connection failed: {str(e)}'}
    
    # Get vessel and surveys
    vessel, surveys, error = get_vessel_surveys(db, vessel_id)
    if error:
        return {'error': error}
    
    if not surveys:
        return {
            'vessel': {
                'id': vessel_id,
                'name': vessel.get('name', 'Unknown'),
                'imo': vessel.get('imo', 'N/A'),
                'imoNumber': vessel.get('imoNumber', vessel.get('imo', 'N/A'))
            },
            'message': 'No completed surveys available for predictions',
            'predictions': [],
            'usingFallback': True
        }
    
    # Calculate vessel age
    current_year = datetime.now().year
    year_built = vessel.get('yearBuilt', current_year - 10)
    vessel_age = current_year - (year_built if isinstance(year_built, int) else current_year - 10)
    
    # Extract features for overall prediction
    features = extract_survey_features(surveys, vessel_age)
    
    if features is None:
        return {'error': 'Failed to extract features from surveys'}
    
    # Scale features and predict
    features_scaled = scaler.transform([features])
    overall_prediction = model.predict(features_scaled)[0]
    
    # Get probability if available
    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(features_scaled)[0]
        # Handle case where model only learned one class
        if len(proba) == 1:
            # Model only has one class (all training data was same class)
            overall_risk_prob = proba[0] if overall_prediction == 1 else 0.2
        else:
            overall_risk_prob = proba[1]  # Probability of high risk class
    else:
        overall_risk_prob = 0.8 if overall_prediction == 1 else 0.2
    
    # Generate component-level predictions
    predictions = []
    
    for component in COMPONENTS:
        # Calculate component-specific risk score
        risk_score = calculate_component_risk_score(model, scaler, surveys, component, vessel_age)
        
        # Adjust with overall model prediction
        adjusted_risk = (risk_score + overall_risk_prob) / 2
        
        # Get current rating and trend
        latest_survey = surveys[0]
        rating_val = latest_survey.get(component, 3.0)
        # Handle None/null separately from 0
        if rating_val is None or rating_val == '':
            current_rating = 3.0
        else:
            current_rating = float(rating_val)
        
        if len(surveys) >= 2:
            prev_val = surveys[1].get(component, 3.0)
            if prev_val is None or prev_val == '':
                prev_rating = 3.0
            else:
                prev_rating = float(prev_val)
            trend = current_rating - prev_rating
        else:
            trend = 0.0
        
        # Generate recommendation
        recommendation = generate_recommendation(component, adjusted_risk, current_rating, trend)
        urgency = get_urgency_level(adjusted_risk)
        
        predictions.append({
            'component': COMPONENT_DISPLAY_NAMES[component],
            'componentKey': component,
            'currentRating': round(current_rating, 1),
            'riskScore': round(adjusted_risk * 10, 2),  # Scale to 0-10
            'riskProbability': round(adjusted_risk * 100, 1),  # As percentage
            'urgency': urgency,
            'trend': round(trend, 2),
            'recommendation': recommendation,
            'vesselId': vessel_id,
            'vesselName': vessel.get('name', 'Unknown'),
            'vesselIMO': vessel.get('imo', 'N/A')
        })
    
    # Sort by risk score (highest first)
    predictions.sort(key=lambda x: x['riskScore'], reverse=True)
    
    # Prepare response
    response = {
        'vessel': {
            'id': vessel_id,
            'name': vessel.get('name', 'Unknown'),
            'imo': vessel.get('imo', 'N/A'),
            'imoNumber': vessel.get('imoNumber', vessel.get('imo', 'N/A')),
            'age': vessel_age
        },
        'overallRisk': {
            'prediction': 'High Risk' if overall_prediction == 1 else 'Low Risk',
            'probability': round(overall_risk_prob * 100, 1),
            'riskScore': round(overall_risk_prob * 10, 2)
        },
        'surveyHistory': {
            'totalSurveys': len(surveys),
            'latestSurveyDate': surveys[0].get('completionDate') or surveys[0].get('scheduledDate'),
            'surveyTypes': list(set([s.get('surveyType', 'Unknown') for s in surveys]))
        },
        'predictions': predictions,
        'timestamp': datetime.now().isoformat()
    }
    
    return response


def main():
    """Command-line interface"""
    parser = argparse.ArgumentParser(description='Generate maintenance predictions for a vessel')
    parser.add_argument('--vesselId', required=True, help='Vessel ID (MongoDB ObjectId)')
    parser.add_argument('--pretty', action='store_true', help='Pretty print JSON output')
    
    args = parser.parse_args()
    
    # Generate predictions
    result = predict_vessel_maintenance(args.vesselId)
    
    # Output as JSON
    if args.pretty:
        print(json.dumps(result, indent=2, default=str))
    else:
        print(json.dumps(result, default=str))


if __name__ == '__main__':
    main()
