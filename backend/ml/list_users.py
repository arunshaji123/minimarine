from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['marine_survey_db']
users = db['users']

print("All users in database:")
print("=" * 60)

all_users = users.find()
count = 0
for user in all_users:
    count += 1
    print(f"\n{count}. {user.get('name', 'N/A')}")
    print(f"   ID: {user['_id']}")
    print(f"   Email: {user.get('email', 'N/A')}")
    print(f"   Role: {user.get('role', 'N/A')}")

print(f"\n{'=' * 60}")
print(f"Total users: {count}")
