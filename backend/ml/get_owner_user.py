from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv('../.env')
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.get_default_database()

owner = db.users.find_one({'role': 'owner'})
if owner:
    print('=' * 50)
    print('OWNER USER CREDENTIALS')
    print('=' * 50)
    print(f'Email: {owner["email"]}')
    print(f'Name: {owner["name"]}')
    print(f'Role: {owner["role"]}')
    print('')
    print('👉 Use this email to login at http://localhost:3000')
    print('=' * 50)
else:
    print('❌ No owner user found in database')
