"""
Quick Sample Dataset Generator - No Kaggle API Required
Generates synthetic training images for ship damage detection
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import random

class SampleDatasetGenerator:
    def __init__(self, base_dir='dataset', samples_per_category=200):
        self.base_dir = Path(base_dir)
        self.samples_per_category = samples_per_category
        self.categories = ['Rust', 'Crack', 'Corrosion', 'Dent', 'Clean']
        self.img_size = (224, 224)
        
    def setup_directories(self):
        """Create directory structure"""
        print("📁 Creating dataset directories...")
        for category in self.categories:
            category_path = self.base_dir / category
            category_path.mkdir(parents=True, exist_ok=True)
            print(f"   ✓ {category_path}")
    
    def generate_rust_image(self):
        """Generate realistic rust pattern"""
        img = Image.new('RGB', self.img_size, (70, 70, 70))
        draw = ImageDraw.Draw(img)
        
        # Base rust colors
        rust_colors = [
            (139, 69, 19), (160, 82, 45), (165, 42, 42),
            (178, 34, 34), (139, 0, 0), (184, 134, 11)
        ]
        
        # Create rust patches
        for _ in range(random.randint(15, 30)):
            x = random.randint(0, self.img_size[0])
            y = random.randint(0, self.img_size[1])
            radius = random.randint(10, 40)
            color = random.choice(rust_colors)
            
            draw.ellipse([x-radius, y-radius, x+radius, y+radius], 
                        fill=color, outline=None)
        
        # Add texture
        img = img.filter(ImageFilter.GaussianBlur(radius=2))
        
        # Add grain
        pixels = img.load()
        for i in range(self.img_size[0]):
            for j in range(self.img_size[1]):
                r, g, b = pixels[i, j]
                noise = random.randint(-20, 20)
                pixels[i, j] = (
                    max(0, min(255, r + noise)),
                    max(0, min(255, g + noise)),
                    max(0, min(255, b + noise))
                )
        
        return img
    
    def generate_crack_image(self):
        """Generate realistic crack pattern"""
        # Steel/concrete base color
        base_color = (random.randint(100, 150), random.randint(100, 150), random.randint(100, 150))
        img = Image.new('RGB', self.img_size, base_color)
        draw = ImageDraw.Draw(img)
        
        # Draw main crack
        num_cracks = random.randint(1, 3)
        for _ in range(num_cracks):
            # Random starting point
            x, y = random.randint(0, self.img_size[0]), random.randint(0, self.img_size[1])
            
            # Draw jagged crack line
            points = [(x, y)]
            for i in range(20):
                x += random.randint(-15, 15)
                y += random.randint(-15, 15)
                x = max(0, min(self.img_size[0]-1, x))
                y = max(0, min(self.img_size[1]-1, y))
                points.append((x, y))
            
            # Draw crack with varying width
            for i in range(len(points)-1):
                width = random.randint(1, 4)
                draw.line([points[i], points[i+1]], fill=(20, 20, 20), width=width)
        
        # Add subtle texture
        img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
        
        return img
    
    def generate_corrosion_image(self):
        """Generate corrosion pattern"""
        # Metal base
        img = Image.new('RGB', self.img_size, (120, 120, 120))
        draw = ImageDraw.Draw(img)
        
        corrosion_colors = [
            (85, 107, 47), (107, 142, 35), (128, 128, 0),
            (139, 69, 19), (160, 82, 45), (144, 238, 144)
        ]
        
        # Create corrosion spots
        for _ in range(random.randint(20, 40)):
            x = random.randint(0, self.img_size[0])
            y = random.randint(0, self.img_size[1])
            size = random.randint(5, 25)
            color = random.choice(corrosion_colors)
            
            # Irregular shapes
            points = []
            for angle in range(0, 360, 30):
                import math
                r = size + random.randint(-5, 5)
                px = x + int(r * math.cos(math.radians(angle)))
                py = y + int(r * math.sin(math.radians(angle)))
                points.append((px, py))
            
            draw.polygon(points, fill=color)
        
        # Blend and add texture
        img = img.filter(ImageFilter.GaussianBlur(radius=1.5))
        
        return img
    
    def generate_dent_image(self):
        """Generate dent/deformation pattern"""
        # Metal surface
        base_color = (random.randint(140, 180), random.randint(140, 180), random.randint(140, 180))
        img = Image.new('RGB', self.img_size, base_color)
        draw = ImageDraw.Draw(img)
        
        # Create dents with shadows
        num_dents = random.randint(1, 4)
        for _ in range(num_dents):
            x = random.randint(20, self.img_size[0]-20)
            y = random.randint(20, self.img_size[1]-20)
            size = random.randint(20, 50)
            
            # Dark shadow (dent depression)
            shadow_color = tuple(max(0, c - 60) for c in base_color)
            draw.ellipse([x-size, y-size, x+size, y+size], fill=shadow_color)
            
            # Highlight edge (raised edge)
            highlight = tuple(min(255, c + 40) for c in base_color)
            draw.arc([x-size-2, y-size-2, x+size+2, y+size+2], 
                    start=45, end=225, fill=highlight, width=3)
        
        # Add metallic texture
        img = img.filter(ImageFilter.SMOOTH)
        
        return img
    
    def generate_clean_image(self):
        """Generate clean surface image"""
        # Clean metal/painted surface
        base_colors = [
            (192, 192, 192), (211, 211, 211), (220, 220, 220),
            (200, 200, 210), (210, 210, 220)
        ]
        base_color = random.choice(base_colors)
        img = Image.new('RGB', self.img_size, base_color)
        
        # Add subtle variations
        pixels = img.load()
        for i in range(self.img_size[0]):
            for j in range(self.img_size[1]):
                r, g, b = base_color
                noise = random.randint(-10, 10)
                pixels[i, j] = (
                    max(0, min(255, r + noise)),
                    max(0, min(255, g + noise)),
                    max(0, min(255, b + noise))
                )
        
        # Slight blur for smooth surface
        img = img.filter(ImageFilter.GaussianBlur(radius=1))
        
        return img
    
    def generate_category(self, category, count):
        """Generate images for a specific category"""
        print(f"🎨 Generating {category} images...")
        
        generators = {
            'Rust': self.generate_rust_image,
            'Crack': self.generate_crack_image,
            'Corrosion': self.generate_corrosion_image,
            'Dent': self.generate_dent_image,
            'Clean': self.generate_clean_image
        }
        
        generator = generators[category]
        
        for i in range(count):
            img = generator()
            img_path = self.base_dir / category / f"{category.lower()}_{i:04d}.jpg"
            img.save(img_path, 'JPEG', quality=85)
            
            if (i + 1) % 50 == 0:
                print(f"   Generated {i + 1}/{count} images...")
        
        print(f"   ✓ Completed {count} {category} images")
    
    def generate_all(self):
        """Generate complete dataset"""
        print("=" * 70)
        print("  🎨 SAMPLE DATASET GENERATOR - Ship Damage Detection")
        print("=" * 70)
        print(f"\nGenerating {self.samples_per_category} images per category")
        print(f"Total images: {self.samples_per_category * len(self.categories)}\n")
        
        self.setup_directories()
        print()
        
        for category in self.categories:
            self.generate_category(category, self.samples_per_category)
        
        self.print_summary()
    
    def print_summary(self):
        """Print dataset summary"""
        print("\n" + "=" * 70)
        print("  📊 DATASET SUMMARY")
        print("=" * 70)
        
        total = 0
        for category in self.categories:
            category_path = self.base_dir / category
            count = len(list(category_path.glob('*.jpg')))
            total += count
            print(f"   ✓ {category:12s}: {count:4d} images")
        
        print("=" * 70)
        print(f"   Total: {total} images")
        print("=" * 70)
        
        print("\n✅ Dataset generation complete!")
        print("\n📝 Next steps:")
        print("   1. Review sample images in dataset/ folder")
        print("   2. (Optional) Add real ship damage images to improve accuracy")
        print("   3. Run training: python train_ship_damage_model.py")
        print("=" * 70)

if __name__ == '__main__':
    # Generate dataset with 200 images per category (1000 total)
    generator = SampleDatasetGenerator(samples_per_category=200)
    generator.generate_all()
