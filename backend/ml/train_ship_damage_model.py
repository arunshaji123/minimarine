"""
Ship Damage Detection CNN Model Training Script
Trains a deep learning model to classify ship damage types
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
import os
import numpy as np
from sklearn.model_selection import train_test_split
import logging
import json
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
DAMAGE_CLASSES = ['Rust', 'Crack', 'Corrosion', 'Dent', 'Clean']
NUM_CLASSES = len(DAMAGE_CLASSES)
BATCH_SIZE = 32
NUM_EPOCHS = 50
LEARNING_RATE = 0.001
IMG_SIZE = 224

class ShipDamageDataset(Dataset):
    """Custom dataset for ship damage images"""
    
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        image = Image.open(img_path).convert('RGB')
        label = self.labels[idx]
        
        if self.transform:
            image = self.transform(image)
        
        return image, label

def create_model(num_classes=NUM_CLASSES):
    """
    Create CNN model for ship damage detection
    Uses transfer learning with ResNet18
    """
    # Load pre-trained ResNet18
    model = models.resnet18(pretrained=True)
    
    # Freeze early layers
    for param in model.parameters():
        param.requires_grad = False
    
    # Replace final fully connected layer
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(0.5),
        nn.Linear(512, num_classes)
    )
    
    return model

def get_data_transforms():
    """Define data augmentation and preprocessing"""
    
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    return train_transform, val_transform

def load_dataset(data_dir):
    """
    Load dataset from directory structure:
    data_dir/
        Rust/
            image1.jpg
            image2.jpg
        Crack/
        Corrosion/
        Dent/
        Clean/
    """
    image_paths = []
    labels = []
    
    for class_idx, class_name in enumerate(DAMAGE_CLASSES):
        class_dir = os.path.join(data_dir, class_name)
        
        if not os.path.exists(class_dir):
            logger.warning(f"Directory not found: {class_dir}")
            continue
        
        for img_name in os.listdir(class_dir):
            if img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(class_dir, img_name)
                image_paths.append(img_path)
                labels.append(class_idx)
    
    logger.info(f"Loaded {len(image_paths)} images from {len(set(labels))} classes")
    return image_paths, labels

def train_model(data_dir='dataset', save_path='models/ship_damage_model.pth'):
    """Train the ship damage detection model"""
    
    logger.info("Starting model training...")
    
    # Check if data directory exists
    if not os.path.exists(data_dir):
        logger.error(f"Dataset directory not found: {data_dir}")
        logger.info("Please create dataset with structure:")
        logger.info("dataset/Rust/, dataset/Crack/, dataset/Corrosion/, dataset/Dent/, dataset/Clean/")
        return False
    
    # Load dataset
    image_paths, labels = load_dataset(data_dir)
    
    if len(image_paths) == 0:
        logger.error("No images found in dataset!")
        return False
    
    # Split dataset
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        image_paths, labels, test_size=0.2, random_state=42, stratify=labels
    )
    
    logger.info(f"Training samples: {len(train_paths)}, Validation samples: {len(val_paths)}")
    
    # Get transforms
    train_transform, val_transform = get_data_transforms()
    
    # Create datasets
    train_dataset = ShipDamageDataset(train_paths, train_labels, train_transform)
    val_dataset = ShipDamageDataset(val_paths, val_labels, val_transform)
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=4)
    
    # Create model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {device}")
    
    model = create_model(NUM_CLASSES).to(device)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.fc.parameters(), lr=LEARNING_RATE)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=5)
    
    # Training loop
    best_val_acc = 0.0
    training_history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': []
    }
    
    for epoch in range(NUM_EPOCHS):
        logger.info(f"\nEpoch {epoch + 1}/{NUM_EPOCHS}")
        
        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for images, labels_batch in train_loader:
            images, labels_batch = images.to(device), labels_batch.to(device)
            
            # Forward pass
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels_batch)
            
            # Backward pass
            loss.backward()
            optimizer.step()
            
            # Statistics
            train_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            train_total += labels_batch.size(0)
            train_correct += (predicted == labels_batch).sum().item()
        
        train_loss = train_loss / len(train_loader)
        train_acc = 100 * train_correct / train_total
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels_batch in val_loader:
                images, labels_batch = images.to(device), labels_batch.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels_batch)
                
                val_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels_batch.size(0)
                val_correct += (predicted == labels_batch).sum().item()
        
        val_loss = val_loss / len(val_loader)
        val_acc = 100 * val_correct / val_total
        
        # Update learning rate
        scheduler.step(val_loss)
        
        # Log progress
        logger.info(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
        logger.info(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
        
        # Save history
        training_history['train_loss'].append(train_loss)
        training_history['train_acc'].append(train_acc)
        training_history['val_loss'].append(val_loss)
        training_history['val_acc'].append(val_acc)
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            torch.save(model, save_path)
            logger.info(f"✓ Model saved with validation accuracy: {val_acc:.2f}%")
    
    # Save training history
    history_path = save_path.replace('.pth', '_history.json')
    with open(history_path, 'w') as f:
        json.dump(training_history, f, indent=2)
    
    logger.info(f"\nTraining completed!")
    logger.info(f"Best validation accuracy: {best_val_acc:.2f}%")
    logger.info(f"Model saved to: {save_path}")
    
    return True

def create_sample_dataset():
    """Create sample dataset structure (for demonstration)"""
    dataset_dir = 'dataset'
    
    logger.info("Creating sample dataset structure...")
    
    for class_name in DAMAGE_CLASSES:
        class_dir = os.path.join(dataset_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)
        logger.info(f"Created directory: {class_dir}")
    
    logger.info("\nDataset structure created!")
    logger.info("Please add your images to the following directories:")
    for class_name in DAMAGE_CLASSES:
        logger.info(f"  - dataset/{class_name}/")
    logger.info("\nRecommended: 200-500 images per class")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train ship damage detection model')
    parser.add_argument('--create-dataset', action='store_true', help='Create sample dataset structure')
    parser.add_argument('--data-dir', type=str, default='dataset', help='Dataset directory')
    parser.add_argument('--save-path', type=str, default='models/ship_damage_model.pth', help='Model save path')
    parser.add_argument('--epochs', type=int, default=50, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    
    args = parser.parse_args()
    
    if args.create_dataset:
        create_sample_dataset()
    else:
        # Update global variables
        NUM_EPOCHS = args.epochs
        BATCH_SIZE = args.batch_size
        LEARNING_RATE = args.lr
        
        # Train model
        train_model(args.data_dir, args.save_path)
