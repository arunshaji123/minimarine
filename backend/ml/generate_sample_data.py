"""
Generate sample survey data for training the ML model
This script creates synthetic survey records if insufficient data exists
"""

import os
import sys
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson.objectid import ObjectId

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import MONGODB_URI, COMPONENTS


def generate_sample_surveys(db, num_vessels=20, surveys_per_vessel=5):
    """
    Generate sample survey data for testing
    
    Args:
        db: MongoDB database connection
        num_vessels: Number of vessels to create
        surveys_per_vessel: Number of surveys per vessel
    """
    vessels_collection = db.vessels
    surveys_collection = db.surveys
    users_collection = db.users
    
    print(f"Generating sample data...")
    print(f"  Vessels: {num_vessels}")
    print(f"  Surveys per vessel: {surveys_per_vessel}")
    print()
    
    # Get or create a surveyor user
    surveyor = users_collection.find_one({'role': 'surveyor'})
    if not surveyor:
        print("No surveyor found. Please create a surveyor user first.")
        return
    
    surveyor_id = surveyor['_id']
    
    # Get or create an owner user
    owner = users_collection.find_one({'role': 'owner'})
    if not owner:
        print("No owner found. Please create an owner user first.")
        return
    
    owner_id = owner['_id']
    
    vessels_created = 0
    surveys_created = 0
    
    # Get max existing IMO number to avoid duplicates
    max_imo = 9000000
    existing_vessels = list(vessels_collection.find({}, {'imo': 1}))
    for v_doc in existing_vessels:
        imo_str = v_doc.get('imo', 'IMO 9000000')
        if isinstance(imo_str, str) and 'IMO' in imo_str:
            try:
                # Extract number from "IMO 1234567" format
                imo_num = int(imo_str.replace('IMO', '').strip())
                max_imo = max(max_imo, imo_num)
            except:
                pass
    
    for v in range(num_vessels):
        # Create a vessel
        vessel_name = f"MV Sample Vessel {v+1}"
        imo_number = f'IMO {max_imo + v + 1}'
        
        # Check if vessel already exists
        existing_vessel = vessels_collection.find_one({'name': vessel_name})
        if existing_vessel:
            vessel_id = existing_vessel['_id']
            print(f"  Vessel '{vessel_name}' already exists, using existing")
        else:
            vessel = {
                'vesselId': f'VSL{max_imo + v + 1}',
                'name': vessel_name,
                'imo': imo_number,
                'vesselType': random.choice(['Container Ship', 'Bulk Carrier', 'Tanker', 'Passenger Ship']),
                'flag': random.choice(['USA', 'Panama', 'Liberia', 'Marshall Islands']),
                'yearBuilt': random.randint(1995, 2020),
                'owner': owner_id,
                'grossTonnage': random.randint(10000, 100000),
                'netTonnage': random.randint(5000, 50000),
                'dimensions': {
                    'length': random.randint(100, 300),
                    'beam': random.randint(20, 50),
                    'draft': random.randint(8, 15)
                },
                'callSign': f'CALL{max_imo + v + 1}',
                'portOfRegistry': random.choice(['New York', 'Singapore', 'London', 'Tokyo']),
                'status': 'Active',
                'createdAt': datetime.now(),
                'updatedAt': datetime.now()
            }
            
            result = vessels_collection.insert_one(vessel)
            vessel_id = result.inserted_id
            vessels_created += 1
            print(f"  Created vessel: {vessel_name}")
        
        # Generate surveys with realistic progression
        base_date = datetime.now() - timedelta(days=365 * 2)  # Start 2 years ago
        
        # Initial ratings (start with decent condition)
        current_ratings = {comp: random.uniform(3.5, 5.0) for comp in COMPONENTS}
        
        for s in range(surveys_per_vessel):
            # Progress time
            survey_date = base_date + timedelta(days=(365 / surveys_per_vessel) * s)
            completion_date = survey_date + timedelta(days=random.randint(1, 5))
            
            # Gradually degrade ratings with some randomness
            for comp in COMPONENTS:
                # 60% chance of slight degradation, 30% no change, 10% improvement
                change_type = random.random()
                if change_type < 0.6:
                    # Degrade
                    current_ratings[comp] = max(1.0, current_ratings[comp] - random.uniform(0.1, 0.5))
                elif change_type < 0.9:
                    # No change (with tiny random variation)
                    current_ratings[comp] = current_ratings[comp] + random.uniform(-0.1, 0.1)
                else:
                    # Improve (maintenance was done)
                    current_ratings[comp] = min(5.0, current_ratings[comp] + random.uniform(0.3, 1.0))
            
            # Generate findings based on low ratings
            findings = []
            for comp in COMPONENTS:
                if current_ratings[comp] < 3.0:
                    # Low rating, add a finding
                    findings.append({
                        'category': random.choice(['Structural', 'Machinery', 'Safety Equipment', 'Environmental']),
                        'severity': random.choice(['Minor', 'Major', 'Critical']),
                        'description': f'Issue detected in {comp}',
                        'location': 'Various locations',
                        'recommendation': 'Schedule maintenance',
                        'actionRequired': True,
                        'dueDate': completion_date + timedelta(days=random.randint(30, 90))
                    })
            
            survey = {
                'title': f'{random.choice(["Annual", "Intermediate", "Special"])} Survey - {vessel_name}',
                'vessel': vessel_id,
                'surveyType': random.choice(['Annual', 'Intermediate', 'Special', 'Drydock']),
                'surveyor': surveyor_id,
                'requestedBy': owner_id,
                'scheduledDate': survey_date,
                'completionDate': completion_date,
                'location': {
                    'port': random.choice(['New York', 'Singapore', 'Rotterdam', 'Shanghai']),
                    'country': random.choice(['USA', 'Singapore', 'Netherlands', 'China']),
                    'coordinates': {
                        'latitude': random.uniform(-90, 90),
                        'longitude': random.uniform(-180, 180)
                    }
                },
                'status': 'Completed',
                'findings': findings if len(findings) > 0 else [],
                'createdAt': survey_date,
                'updatedAt': completion_date
            }
            
            # Add component ratings
            for comp in COMPONENTS:
                survey[comp] = round(current_ratings[comp], 1)
            
            surveys_collection.insert_one(survey)
            surveys_created += 1
        
        print(f"  Created {surveys_per_vessel} surveys for {vessel_name}")
    
    print()
    print("="*50)
    print("Sample Data Generation Complete")
    print("="*50)
    print(f"Vessels created: {vessels_created}")
    print(f"Surveys created: {surveys_created}")
    print(f"Total vessels in DB: {vessels_collection.count_documents({})}")
    print(f"Total surveys in DB: {surveys_collection.count_documents({})}")


def main():
    """Main function"""
    print("="*50)
    print("SAMPLE SURVEY DATA GENERATOR")
    print("="*50)
    print()
    
    # Connect to MongoDB
    try:
        client = MongoClient(MONGODB_URI)
        db = client.get_default_database()
        db.command('ping')
        print("✓ Connected to MongoDB")
        print()
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        sys.exit(1)
    
    # Check existing data
    vessels_count = db.vessels.count_documents({})
    surveys_count = db.surveys.count_documents({'status': 'Completed'})
    
    print(f"Current database status:")
    print(f"  Vessels: {vessels_count}")
    print(f"  Completed Surveys: {surveys_count}")
    print()
    
    if surveys_count >= 100:
        print("✓ Sufficient survey data already exists (100+)")
        print("  No need to generate sample data")
        return
    
    # Ask user for confirmation
    print("This will generate sample survey data for training the ML model.")
    response = input("Continue? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("Cancelled")
        return
    
    # Generate sample data
    generate_sample_surveys(db, num_vessels=20, surveys_per_vessel=5)
    
    print()
    print("✓ Sample data generation complete!")
    print("  You can now run: python train_model.py")


if __name__ == '__main__':
    main()
