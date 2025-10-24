const mongoose = require('mongoose');

const cargoSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: [true, 'Cargo reference is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Cargo description is required'],
    trim: true
  },
  cargoType: {
    type: String,
    required: [true, 'Cargo type is required'],
    enum: ['Container', 'Bulk', 'Liquid', 'Break Bulk', 'RoRo', 'Other']
  },
  quantity: {
    value: {
      type: Number,
      required: [true, 'Quantity value is required'],
      min: [1, 'Quantity must be positive']
    },
    unit: {
      type: String,
      required: [true, 'Quantity unit is required'],
      enum: ['TEU', 'MT', 'KG', 'LBS', 'CBM', 'Pieces']
    }
  },
  weight: {
    value: {
      type: Number,
      required: [true, 'Weight value is required'],
      min: [1, 'Weight must be positive']
    },
    unit: {
      type: String,
      required: [true, 'Weight unit is required'],
      enum: ['MT', 'KG', 'LBS', 'TONS']
    }
  },
  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vessel',
    required: [true, 'Vessel is required']
  },
  voyage: {
    number: {
      type: String,
      required: [true, 'Voyage number is required'],
      trim: true
    },
    departurePort: {
      type: String,
      required: [true, 'Departure port is required'],
      trim: true
    },
    departureDate: {
      type: Date,
      required: [true, 'Departure date is required']
    },
    arrivalPort: {
      type: String,
      required: [true, 'Arrival port is required'],
      trim: true
    },
    estimatedArrivalDate: {
      type: Date,
      required: [true, 'Estimated arrival date is required']
    }
  },
  shipper: {
    name: {
      type: String,
      required: [true, 'Shipper name is required'],
      trim: true
    },
    contact: {
      type: String,
      required: [true, 'Shipper contact is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Shipper email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Shipper phone is required'],
      trim: true
    }
  },
  consignee: {
    name: {
      type: String,
      required: [true, 'Consignee name is required'],
      trim: true
    },
    contact: {
      type: String,
      required: [true, 'Consignee contact is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Consignee email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Consignee phone is required'],
      trim: true
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Booked', 'In Transit', 'Arrived', 'Delivered', 'Delayed', 'Cancelled'],
    default: 'Booked'
  },
  specialRequirements: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
cargoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
// Note: reference already has unique index, no need to add another
cargoSchema.index({ vessel: 1 });
cargoSchema.index({ status: 1 });
cargoSchema.index({ createdAt: -1 });

const Cargo = mongoose.model('Cargo', cargoSchema, 'active_cargo_shipments');

module.exports = Cargo;