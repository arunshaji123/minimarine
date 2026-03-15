from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv('../.env')
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.get_default_database()

vessel = db.vessels.find_one()
if vessel:
    print(f"Test Vessel ID: {vessel['_id']}")
    print(f"Vessel Name: {vessel['name']}")
else:
    print("No vessels found")
