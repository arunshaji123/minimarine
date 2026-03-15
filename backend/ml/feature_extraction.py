"""
Feature extraction utilities for marine survey ML model
Extracts features from survey documents to train and predict maintenance issues
"""

import numpy as np
from datetime import datetime, timedelta
from config import COMPONENTS


def extract_survey_features(surveys, vessel_age_years=10):
    """
    Extract features from a list of surveys for a single vessel
    
    Args:
        surveys: List of survey documents (sorted by date, newest first)
        vessel_age_years: Age of the vessel in years
    
    Returns:
        numpy array of features
    """
    if not surveys or len(surveys) == 0:
        return None
    
    latest_survey = surveys[0]
    features = []
    
    # 1. Latest component ratings (8 features)
    for component in COMPONENTS:
        rating = latest_survey.get(component, 3.0)
        # Handle None/null separately from 0
        if rating is None or rating == '':
            rating = 3.0  # Use default only for missing values
        else:
            rating = float(rating)  # Accept 0 as valid rating
        features.append(rating)
    
    # 2. Average ratings across all surveys (8 features)
    if len(surveys) > 1:
        for component in COMPONENTS:
            ratings = [s.get(component, 3.0) for s in surveys]
            # Handle None/null but accept 0 as valid
            ratings = [float(r) if (r is not None and r != '') else 3.0 for r in ratings]
            avg_rating = np.mean(ratings)
            features.append(avg_rating)
    else:
        # Use latest ratings if only one survey
        features.extend(features[:8])
    
    # 3. Rating trends (8 features) - difference between latest and previous
    if len(surveys) >= 2:
        for component in COMPONENTS:
            latest_val = surveys[0].get(component, 3.0)
            prev_val = surveys[1].get(component, 3.0)
            
            # Handle None/null but accept 0
            latest = float(latest_val) if (latest_val is not None and latest_val != '') else 3.0
            previous = float(prev_val) if (prev_val is not None and prev_val != '') else 3.0
            
            trend = latest - previous
            features.append(trend)
    else:
        # No trend data
        features.extend([0.0] * 8)
    
    # 4. Days since last inspection
    completion_date = latest_survey.get('completionDate') or latest_survey.get('scheduledDate')
    if completion_date:
        if isinstance(completion_date, str):
            completion_date = datetime.fromisoformat(completion_date.replace('Z', '+00:00'))
        days_since = (datetime.now() - completion_date).days
    else:
        days_since = 90  # default
    features.append(min(days_since, 365))  # cap at 365 days
    
    # 5. Number of findings in latest survey
    findings = latest_survey.get('findings', [])
    num_findings = len(findings) if findings else 0
    features.append(min(num_findings, 20))  # cap at 20
    
    # 6. Survey frequency (surveys per year)
    if len(surveys) >= 2:
        first_date = surveys[-1].get('completionDate') or surveys[-1].get('scheduledDate')
        last_date = surveys[0].get('completionDate') or surveys[0].get('scheduledDate')
        
        if first_date and last_date:
            if isinstance(first_date, str):
                first_date = datetime.fromisoformat(first_date.replace('Z', '+00:00'))
            if isinstance(last_date, str):
                last_date = datetime.fromisoformat(last_date.replace('Z', '+00:00'))
            
            days_span = (last_date - first_date).days
            if days_span > 0:
                survey_frequency = (len(surveys) / days_span) * 365
            else:
                survey_frequency = 1.0
        else:
            survey_frequency = 1.0
    else:
        survey_frequency = 1.0
    features.append(min(survey_frequency, 10.0))  # cap at 10 surveys/year
    
    # 7. Vessel age
    features.append(min(vessel_age_years, 50))  # cap at 50 years
    
    # 8. Minimum rating across all components (worst component)
    component_ratings = []
    for c in COMPONENTS:
        val = latest_survey.get(c, 3.0)
        rating = float(val) if (val is not None and val != '') else 3.0
        component_ratings.append(rating)
    features.append(min(component_ratings))
    
    # 9. Standard deviation of ratings (component consistency)
    features.append(np.std(component_ratings))
    
    return np.array(features)


def extract_component_features(surveys, component_name, vessel_age_years=10):
    """
    Extract features specific to a single component
    
    Args:
        surveys: List of survey documents
        component_name: Name of the component to analyze
        vessel_age_years: Age of vessel
    
    Returns:
        numpy array of component-specific features
    """
    if not surveys or len(surveys) == 0:
        return None
    
    features = []
    
    # Latest rating for this component
    latest_rating = float(surveys[0].get(component_name, 3.0) or 3.0)
    features.append(latest_rating)
    
    # Average rating across surveys
    ratings = [float(s.get(component_name, 3.0) or 3.0) for s in surveys]
    features.append(np.mean(ratings))
    
    # Minimum rating (worst ever)
    features.append(np.min(ratings))
    
    # Rating trend
    if len(surveys) >= 2:
        trend = latest_rating - float(surveys[1].get(component_name, 3.0) or 3.0)
    else:
        trend = 0.0
    features.append(trend)
    
    # Days since last inspection
    completion_date = surveys[0].get('completionDate') or surveys[0].get('scheduledDate')
    if completion_date:
        if isinstance(completion_date, str):
            completion_date = datetime.fromisoformat(completion_date.replace('Z', '+00:00'))
        days_since = (datetime.now() - completion_date).days
    else:
        days_since = 90
    features.append(min(days_since, 365))
    
    # Vessel age
    features.append(min(vessel_age_years, 50))
    
    # Has findings flag
    has_findings = 1.0 if surveys[0].get('findings') else 0.0
    features.append(has_findings)
    
    return np.array(features)


def create_labels_from_surveys(surveys):
    """
    Create training labels from survey data
    A survey is considered "high risk" if:
    - Any component has rating < 3
    - Has 3 or more findings
    - Multiple components declined since last survey
    
    Args:
        surveys: List of survey documents for analysis
    
    Returns:
        1 if high risk, 0 otherwise
    """
    if not surveys or len(surveys) == 0:
        return 0
    
    latest = surveys[0]
    
    # Check for low ratings
    component_ratings = [float(latest.get(c, 3.0) or 3.0) for c in COMPONENTS]
    has_low_rating = any(r < 3.0 for r in component_ratings)
    
    # Check findings count
    findings = latest.get('findings', [])
    high_findings = len(findings) >= 3 if findings else False
    
    # Check multiple declining components
    declining_count = 0
    if len(surveys) >= 2:
        for component in COMPONENTS:
            current = float(latest.get(component, 3.0) or 3.0)
            previous = float(surveys[1].get(component, 3.0) or 3.0)
            if current < previous:
                declining_count += 1
    
    multiple_declining = declining_count >= 3
    
    # Label as high risk if any condition is met
    return 1 if (has_low_rating or high_findings or multiple_declining) else 0
