"""
Automated Kaggle Dataset Downloader for Ship Damage Detection
Downloads and organizes datasets from Kaggle into the required folder structure
"""

import os
import sys
import shutil
import zipfile
from pathlib import Path
import json

# Dataset configuration - multiple Kaggle datasets for ship/steel/metal damage
DATASETS = [
    {
        'name': 'NEU Surface Defect Database',
        'dataset_id': 'fantacher/neu-metal-surface-defects-data',
        'categories_mapping': {
            'Cr': 'Crack',      # Cracks
            'In': 'Dent',       # Inclusions (dents)
            'Pa': 'Clean',      # Patches (clean areas)
            'PS': 'Corrosion',  # Pitted surface
            'RS': 'Rust',       # Rolled-in scale (rust-like)
            'Sc': 'Corrosion'   # Scratches (corrosion)
        }
    },
    {
        'name': 'Steel Defect Detection',
        'dataset_id': 'urvishramaiya/severstal-steel-defect-detection',
        'manual_organize': True  # Will need manual organization
    },
    {
        'name': 'Concrete Crack Images',
        'dataset_id': 'arunrk7/surface-crack-detection',
        'categories_mapping': {
            'Positive': 'Crack',
            'Negative': 'Clean'
        }
    }
]

class KaggleDatasetDownloader:
    def __init__(self, base_dir='dataset'):
        self.base_dir = Path(base_dir)
        self.categories = ['Rust', 'Crack', 'Corrosion', 'Dent', 'Clean']
        self.downloads_dir = Path('kaggle_downloads')
        
    def setup_directories(self):
        """Create required directory structure"""
        print("📁 Setting up directories...")
        
        # Create main dataset folders
        for category in self.categories:
            category_path = self.base_dir / category
            category_path.mkdir(parents=True, exist_ok=True)
            print(f"   ✓ {category_path}")
        
        # Create downloads directory
        self.downloads_dir.mkdir(exist_ok=True)
        print(f"   ✓ {self.downloads_dir}")
        
    def check_kaggle_credentials(self):
        """Check if Kaggle API credentials are configured"""
        print("\n🔑 Checking Kaggle credentials...")
        
        kaggle_dir = Path.home() / '.kaggle'
        kaggle_json = kaggle_dir / 'kaggle.json'
        
        if not kaggle_json.exists():
            print("\n❌ Kaggle credentials not found!")
            print("\n📝 To set up Kaggle API credentials:")
            print("   1. Go to https://www.kaggle.com/")
            print("   2. Click on your profile picture → Account")
            print("   3. Scroll to 'API' section → Click 'Create New Token'")
            print("   4. Download kaggle.json file")
            print(f"   5. Place it in: {kaggle_dir}")
            print("\n   OR run these commands:")
            print(f"      mkdir {kaggle_dir}")
            print(f"      # Copy kaggle.json to {kaggle_dir}")
            print(f"      # On Windows: icacls {kaggle_json} /inheritance:r /grant:r %username%:R")
            
            # Check if user wants to enter credentials manually
            print("\n⚠️  Alternative: Enter credentials manually")
            username = input("   Kaggle Username (or press Enter to exit): ").strip()
            if not username:
                return False
            
            key = input("   Kaggle API Key: ").strip()
            if not key:
                return False
            
            # Create credentials
            kaggle_dir.mkdir(exist_ok=True)
            with open(kaggle_json, 'w') as f:
                json.dump({"username": username, "key": key}, f)
            
            # Set permissions (Windows)
            if sys.platform == 'win32':
                os.system(f'icacls "{kaggle_json}" /inheritance:r /grant:r %username%:R')
            else:
                os.chmod(kaggle_json, 0o600)
            
            print(f"   ✓ Credentials saved to {kaggle_json}")
        else:
            print(f"   ✓ Credentials found at {kaggle_json}")
        
        return True
    
    def download_dataset(self, dataset_id, output_dir):
        """Download a Kaggle dataset"""
        try:
            import kaggle
            
            print(f"\n📥 Downloading: {dataset_id}")
            print(f"   Destination: {output_dir}")
            
            # Download dataset
            kaggle.api.dataset_download_files(
                dataset_id,
                path=output_dir,
                unzip=True,
                quiet=False
            )
            
            print(f"   ✓ Download complete!")
            return True
            
        except Exception as e:
            print(f"   ❌ Error downloading {dataset_id}: {e}")
            return False
    
    def organize_neu_dataset(self, download_path, mapping):
        """Organize NEU Surface Defect Database"""
        print("\n🗂️  Organizing NEU dataset...")
        
        # Find images directory
        images_dir = None
        for root, dirs, files in os.walk(download_path):
            if any(f.endswith(('.jpg', '.png', '.bmp')) for f in files):
                images_dir = Path(root)
                break
        
        if not images_dir:
            print("   ❌ No images found in download")
            return 0
        
        count = 0
        for img_file in images_dir.glob('*.*'):
            if img_file.suffix.lower() not in ['.jpg', '.png', '.bmp', '.jpeg']:
                continue
            
            # Get category from filename prefix
            prefix = img_file.stem.split('_')[0]
            if prefix in mapping:
                target_category = mapping[prefix]
                target_path = self.base_dir / target_category / img_file.name
                shutil.copy2(img_file, target_path)
                count += 1
        
        print(f"   ✓ Organized {count} images")
        return count
    
    def organize_crack_dataset(self, download_path, mapping):
        """Organize Concrete Crack Images dataset"""
        print("\n🗂️  Organizing Crack dataset...")
        
        count = 0
        for category, target in mapping.items():
            category_path = download_path / category
            if not category_path.exists():
                # Try to find in subdirectories
                for root, dirs, files in os.walk(download_path):
                    if category.lower() in root.lower():
                        category_path = Path(root)
                        break
            
            if not category_path.exists():
                continue
            
            for img_file in category_path.glob('*.*'):
                if img_file.suffix.lower() not in ['.jpg', '.png', '.bmp', '.jpeg']:
                    continue
                
                target_path = self.base_dir / target / f"{target.lower()}_{count}_{img_file.name}"
                shutil.copy2(img_file, target_path)
                count += 1
        
        print(f"   ✓ Organized {count} images")
        return count
    
    def download_sample_images_fallback(self):
        """Fallback: Create sample dataset using image search"""
        print("\n📸 Creating sample dataset with synthetic data...")
        print("   (For production, replace with real images)")
        
        try:
            from PIL import Image, ImageDraw, ImageFont
            import random
            
            # Generate sample images for each category
            samples_per_category = 50
            img_size = (224, 224)
            
            colors = {
                'Rust': [(139, 69, 19), (160, 82, 45), (165, 42, 42)],
                'Crack': [(128, 128, 128), (105, 105, 105), (169, 169, 169)],
                'Corrosion': [(85, 107, 47), (107, 142, 35), (128, 128, 0)],
                'Dent': [(119, 136, 153), (112, 128, 144), (176, 196, 222)],
                'Clean': [(192, 192, 192), (211, 211, 211), (220, 220, 220)]
            }
            
            for category in self.categories:
                print(f"   Generating {category} samples...")
                category_colors = colors[category]
                
                for i in range(samples_per_category):
                    # Create image with random patterns
                    img = Image.new('RGB', img_size, random.choice(category_colors))
                    draw = ImageDraw.Draw(img)
                    
                    # Add random patterns based on category
                    for _ in range(random.randint(5, 15)):
                        x1 = random.randint(0, img_size[0]-1)
                        y1 = random.randint(0, img_size[1]-1)
                        x2 = random.randint(x1, img_size[0])
                        y2 = random.randint(y1, img_size[1])
                        
                        if category == 'Crack':
                            draw.line([(x1, y1), (x2, y2)], fill=(0, 0, 0), width=2)
                        elif category in ['Rust', 'Corrosion']:
                            draw.ellipse([x1, y1, x2, y2], fill=random.choice(category_colors))
                        elif category == 'Dent':
                            draw.rectangle([x1, y1, x2, y2], fill=random.choice(category_colors))
                    
                    # Save image
                    img_path = self.base_dir / category / f"sample_{category.lower()}_{i:04d}.jpg"
                    img.save(img_path, 'JPEG')
                
                print(f"   ✓ Generated {samples_per_category} {category} images")
            
            print(f"\n   ✓ Total: {samples_per_category * len(self.categories)} sample images created")
            print("   ⚠️  These are synthetic images for testing only!")
            print("   📝 Replace with real ship damage images for production use")
            
            return samples_per_category * len(self.categories)
            
        except Exception as e:
            print(f"   ❌ Error creating samples: {e}")
            return 0
    
    def count_images(self):
        """Count images in each category"""
        print("\n📊 Dataset Summary:")
        print("=" * 50)
        
        total = 0
        for category in self.categories:
            category_path = self.base_dir / category
            count = len(list(category_path.glob('*.*')))
            total += count
            status = "✓" if count >= 100 else "⚠️"
            print(f"   {status} {category:12s}: {count:4d} images")
        
        print("=" * 50)
        print(f"   Total: {total} images")
        
        if total < 500:
            print("\n   ⚠️  Warning: Low image count!")
            print("   Recommended: 200+ images per category (1000+ total)")
        else:
            print("\n   ✓ Dataset ready for training!")
        
        return total
    
    def run(self):
        """Main execution flow"""
        print("=" * 70)
        print("  🚢 KAGGLE DATASET DOWNLOADER - Ship Damage Detection")
        print("=" * 70)
        
        # Step 1: Setup directories
        self.setup_directories()
        
        # Step 2: Check Kaggle credentials
        if not self.check_kaggle_credentials():
            print("\n❌ Cannot proceed without Kaggle credentials")
            print("💡 Falling back to sample dataset generation...")
            
            response = input("\n   Generate sample dataset? (y/n): ").strip().lower()
            if response == 'y':
                self.download_sample_images_fallback()
                self.count_images()
            return
        
        # Step 3: Download and organize datasets
        total_organized = 0
        
        for dataset in DATASETS:
            print(f"\n📦 Processing: {dataset['name']}")
            
            dataset_dir = self.downloads_dir / dataset['dataset_id'].replace('/', '_')
            dataset_dir.mkdir(parents=True, exist_ok=True)
            
            # Download dataset
            if self.download_dataset(dataset['dataset_id'], dataset_dir):
                # Organize based on dataset type
                if 'categories_mapping' in dataset:
                    if 'neu' in dataset['dataset_id'].lower():
                        count = self.organize_neu_dataset(dataset_dir, dataset['categories_mapping'])
                    elif 'crack' in dataset['dataset_id'].lower():
                        count = self.organize_crack_dataset(dataset_dir, dataset['categories_mapping'])
                    else:
                        count = 0
                    
                    total_organized += count
            
            print(f"   Progress: {total_organized} images organized so far")
        
        # Step 4: Check if we have enough data
        total_images = self.count_images()
        
        if total_images < 100:
            print("\n⚠️  Too few images downloaded from Kaggle")
            print("💡 Supplementing with sample data...")
            self.download_sample_images_fallback()
            self.count_images()
        
        print("\n" + "=" * 70)
        print("  ✅ Dataset preparation complete!")
        print("=" * 70)
        print("\n📝 Next steps:")
        print("   1. Review images in each category folder")
        print("   2. Remove any incorrect classifications")
        print("   3. Add more images if needed (200+ per category recommended)")
        print("   4. Run training: python train_ship_damage_model.py")
        print("=" * 70)

if __name__ == '__main__':
    downloader = KaggleDatasetDownloader()
    downloader.run()
