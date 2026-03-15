import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB configuration
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/marine_survey')

# Model configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

# Component names from Survey model
COMPONENTS = [
    'hullInspection',
    'deckSuperstructure',
    'machineryEngineRoom',
    'electricalSystems',
    'safetyEquipment',
    'navigationEquipment',
    'pollutionControlSystems',
    'certificatesVerification'
]

COMPONENT_DISPLAY_NAMES = {
    'hullInspection': 'Hull Inspection',
    'deckSuperstructure': 'Deck & Superstructure',
    'machineryEngineRoom': 'Machinery & Engine Room',
    'electricalSystems': 'Electrical Systems',
    'safetyEquipment': 'Safety Equipment',
    'navigationEquipment': 'Navigation Equipment',
    'pollutionControlSystems': 'Pollution Control Systems',
    'certificatesVerification': 'Certificates Verification'
}

# Risk thresholds
RISK_THRESHOLDS = {
    'critical': 0.85,
    'high': 0.70,
    'medium': 0.50,
    'low': 0.30
}
