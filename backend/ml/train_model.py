"""
Train the predictive maintenance ML model
This script fetches historical survey data and trains a RandomForest classifier
"""

import os
import sys
import numpy as np
import joblib
from pymongo import MongoClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import MONGODB_URI, MODEL_PATH, SCALER_PATH, COMPONENTS
from feature_extraction import extract_survey_features, create_labels_from_surveys


def fetch_vessel_survey_data(db):
    """
    Fetch all vessels and their completed surveys from MongoDB
    
    Returns:
        List of (vessel_id, surveys_list) tuples
    """
    vessels_collection = db.vessels
    surveys_collection = db.surveys
    
    vessel_data = []
    
    # Get all vessels
    vessels = list(vessels_collection.find())
    print(f"Found {len(vessels)} vessels in database")
    
    for vessel in vessels:
        vessel_id = str(vessel['_id'])
        
        # Get completed surveys for this vessel, sorted by date
        surveys = list(surveys_collection.find({
            'vessel': vessel['_id'],
            'status': 'Completed'
        }).sort('completionDate', -1))
        
        if len(surveys) >= 2:  # Need at least 2 surveys for meaningful analysis
            vessel_data.append({
                'vessel_id': vessel_id,
                'vessel_name': vessel.get('name', 'Unknown'),
                'surveys': surveys,
                'vessel_age': vessel.get('yearBuilt', datetime.now().year - 10)
            })
    
    print(f"Found {len(vessel_data)} vessels with at least 2 completed surveys")
    return vessel_data


def prepare_training_data(vessel_data):
    """
    Prepare features and labels for training
    
    Args:
        vessel_data: List of vessel survey data
    
    Returns:
        X: Feature matrix
        y: Labels
        vessel_ids: Corresponding vessel IDs
    """
    X = []
    y = []
    vessel_ids = []
    
    for data in vessel_data:
        surveys = data['surveys']
        vessel_id = data['vessel_id']
        
        # Calculate vessel age
        current_year = datetime.now().year
        year_built = data['vessel_age']
        vessel_age = current_year - (year_built if isinstance(year_built, int) else current_year - 10)
        
        # Extract features
        features = extract_survey_features(surveys, vessel_age)
        
        if features is not None:
            # Create label based on survey conditions
            label = create_labels_from_surveys(surveys)
            
            X.append(features)
            y.append(label)
            vessel_ids.append(vessel_id)
    
    return np.array(X), np.array(y), vessel_ids


def train_model(X, y):
    """
    Train RandomForest classifier
    
    Args:
        X: Feature matrix
        y: Labels
    
    Returns:
        Trained model and scaler
    """
    print(f"\nTraining data shape: {X.shape}")
    print(f"Class distribution: {np.bincount(y)}")
    print(f"  - Low risk (0): {np.sum(y == 0)} samples")
    print(f"  - High risk (1): {np.sum(y == 1)} samples")
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    # Check if we can stratify (need at least 2 samples per class)
    can_stratify = len(np.unique(y)) > 1 and np.min(np.bincount(y)) >= 2
    
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y if can_stratify else None
    )
    
    print(f"\nTraining set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")
    
    # Train RandomForest
    print("\nTraining RandomForest classifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced'  # Handle imbalanced data
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    print("\n" + "="*50)
    print("MODEL EVALUATION")
    print("="*50)
    
    # Training accuracy
    train_pred = model.predict(X_train)
    train_accuracy = accuracy_score(y_train, train_pred)
    print(f"\nTraining Accuracy: {train_accuracy:.2%}")
    
    # Test accuracy
    y_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)
    print(f"Test Accuracy: {test_accuracy:.2%}")
    
    # Cross-validation
    if len(X_train) >= 10:
        cv_scores = cross_val_score(model, X_train, y_train, cv=min(5, len(X_train)//2), scoring='accuracy')
        print(f"Cross-validation Accuracy: {cv_scores.mean():.2%} (+/- {cv_scores.std():.2%})")
    
    # Classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk', 'High Risk'], zero_division=0))
    
    # Confusion matrix
    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    
    # Feature importance
    feature_names = []
    for comp in COMPONENTS:
        feature_names.append(f"{comp}_latest")
    for comp in COMPONENTS:
        feature_names.append(f"{comp}_avg")
    for comp in COMPONENTS:
        feature_names.append(f"{comp}_trend")
    feature_names.extend(['days_since', 'num_findings', 'survey_freq', 'vessel_age', 'min_rating', 'rating_std'])
    
    importances = model.feature_importances_
    indices = np.argsort(importances)[-10:]  # Top 10 features
    
    print("\nTop 10 Most Important Features:")
    for i in indices[::-1]:
        print(f"  {feature_names[i]}: {importances[i]:.4f}")
    
    return model, scaler


def main():
    """Main training function"""
    print("="*50)
    print("MARINE SURVEY PREDICTIVE MAINTENANCE MODEL TRAINING")
    print("="*50)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Connect to MongoDB
    print(f"Connecting to MongoDB...")
    print(f"URI: {MONGODB_URI[:50]}...")
    
    try:
        client = MongoClient(MONGODB_URI)
        db = client.get_default_database()
        
        # Test connection
        db.command('ping')
        print("✓ MongoDB connection successful\n")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        sys.exit(1)
    
    # Fetch data
    print("Fetching vessel and survey data...")
    vessel_data = fetch_vessel_survey_data(db)
    
    if len(vessel_data) < 10:
        print(f"\n⚠ Warning: Only {len(vessel_data)} vessels with sufficient survey history found.")
        print("  The model may not generalize well with limited training data.")
        print("  Consider adding more survey records before training.\n")
        
        if len(vessel_data) < 5:
            print("✗ Insufficient training data (need at least 5 vessels with 2+ surveys)")
            sys.exit(1)
    
    # Prepare training data
    print("\nPreparing training features...")
    X, y, vessel_ids = prepare_training_data(vessel_data)
    
    if len(X) < 10:
        print(f"✗ Insufficient training samples: {len(X)}")
        print("  Need at least 10 samples to train a model")
        sys.exit(1)
    
    # Train model
    model, scaler = train_model(X, y)
    
    # Save model and scaler
    print(f"\nSaving model to: {MODEL_PATH}")
    joblib.dump(model, MODEL_PATH)
    
    print(f"Saving scaler to: {SCALER_PATH}")
    joblib.dump(scaler, SCALER_PATH)
    
    print("\n" + "="*50)
    print("✓ MODEL TRAINING COMPLETE")
    print("="*50)
    print(f"\nModel and scaler saved successfully!")
    print(f"Total training samples: {len(X)}")
    print(f"Model type: RandomForest with {model.n_estimators} trees")
    print(f"\nYou can now use the model for predictions via:")
    print(f"  python predict.py --vesselId <vessel_id>")


if __name__ == '__main__':
    main()
