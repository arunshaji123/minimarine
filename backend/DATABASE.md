# Marine Survey System Database Documentation

## Database Models

### User Model

Stores user account information with role-based access control.

```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'surveyor', 'owner', 'ship_management', 'cargo_manager'],
    default: 'surveyor'
  },
  // Additional fields...
});
```

### Vessel Model

Stores vessel information including ownership, specifications, and certificates.

```javascript
const vesselSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imoNumber: { type: String, required: true, unique: true },
  vesselType: { type: String, required: true },
  flag: String,
  yearBuilt: Number,
  grossTonnage: Number,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shipManagement: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classification: String,
  // Additional fields...
});
```

### Survey Model

Stores marine survey information including findings, attachments, and status.

```javascript
const surveySchema = new mongoose.Schema({
  title: { type: String, required: true },
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  surveyType: { type: String, required: true },
  surveyor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledDate: { type: Date, required: true },
  completionDate: Date,
  location: { port: String, country: String },
  status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], default: 'Scheduled' },
  findings: [{ category: String, description: String, severity: String, recommendations: String }],
  // Additional fields...
});
```

### Cargo Model

Stores cargo shipment information including vessel, documents, and status.

```javascript
const cargoSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  quantity: Number,
  weight: Number,
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel' },
  voyage: { departure: { port: String, date: Date }, arrival: { port: String, date: Date } },
  shipper: { name: String, contact: String },
  consignee: { name: String, contact: String },
  cargoManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Scheduled', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'], default: 'Scheduled' },
  // Additional fields...
});
```

### Maintenance Model

Stores vessel maintenance records including scheduled tasks, parts, and costs.

```javascript
const maintenanceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  maintenanceType: { type: String, required: true, enum: ['Scheduled', 'Corrective', 'Emergency', 'Drydock', 'Overhaul', 'Other'] },
  system: { type: String, required: true, enum: ['Engine', 'Hull', 'Electrical', 'Navigation', 'Safety', 'Deck', 'Other'] },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledDate: { type: Date, required: true },
  completionDate: Date,
  status: { type: String, enum: ['Planned', 'In Progress', 'Completed', 'Delayed', 'Cancelled'], default: 'Planned' },
  // Additional fields...
});
```

### Crew Model

Stores vessel crew information including documents, certifications, and contracts.

```javascript
const crewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true, enum: ['Captain', 'Chief Officer', 'Second Officer', 'Third Officer', 'Chief Engineer', 'Second Engineer', 'Third Engineer', 'Electrician', 'Bosun', 'Able Seaman', 'Ordinary Seaman', 'Cook', 'Steward', 'Other'] },
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  nationality: { type: String, required: true },
  documents: [{ type: String, number: String, issueDate: Date, expiryDate: Date, issuingAuthority: String, url: String }],
  certifications: [{ name: String, number: String, issueDate: Date, expiryDate: Date, issuingAuthority: String, status: String }],
  status: { type: String, enum: ['Active', 'On Leave', 'Signed Off', 'Terminated'], default: 'Active' },
  // Additional fields...
});
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Vessels

- `GET /api/vessels` - Get all vessels (filtered by user role)
- `GET /api/vessels/:id` - Get vessel by ID
- `POST /api/vessels` - Create a new vessel (Admin, Owner)
- `PUT /api/vessels/:id` - Update a vessel (Admin, Owner, Ship Management)
- `DELETE /api/vessels/:id` - Delete a vessel (Admin, Owner)

### Surveys

- `GET /api/surveys` - Get all surveys (filtered by user role)
- `GET /api/surveys/:id` - Get survey by ID
- `POST /api/surveys` - Create a new survey (Admin, Owner, Ship Management)
- `PUT /api/surveys/:id` - Update a survey (Admin, Surveyor for assigned surveys, Owner/Ship Management for their vessels)
- `DELETE /api/surveys/:id` - Delete a survey (Admin, Owner/Ship Management for their vessels)

### Cargo

- `GET /api/cargo` - Get all cargo shipments (filtered by user role)
- `GET /api/cargo/:id` - Get cargo by ID
- `POST /api/cargo` - Create a new cargo shipment (Admin, Cargo Manager)
- `PUT /api/cargo/:id` - Update a cargo shipment (Admin, Cargo Manager for assigned cargo)
- `DELETE /api/cargo/:id` - Delete a cargo shipment (Admin, Cargo Manager for assigned cargo)

### Maintenance

- `GET /api/maintenance` - Get all maintenance records (filtered by user role)
- `GET /api/maintenance/:id` - Get maintenance by ID
- `POST /api/maintenance` - Create a new maintenance record (Admin, Ship Management)
- `PUT /api/maintenance/:id` - Update a maintenance record (Admin, Ship Management for their vessels)
- `DELETE /api/maintenance/:id` - Delete a maintenance record (Admin, Ship Management for their vessels)

### Crew

- `GET /api/crew` - Get all crew records (filtered by user role)
- `GET /api/crew/:id` - Get crew by ID
- `POST /api/crew` - Create a new crew record (Admin, Ship Management)
- `PUT /api/crew/:id` - Update a crew record (Admin, Ship Management for their vessels)
- `DELETE /api/crew/:id` - Delete a crew record (Admin, Ship Management for their vessels)

## Role-Based Access Control

### Admin
- Full access to all resources

### Surveyor
- View all vessels
- View and update assigned surveys
- View all cargo, maintenance, and crew records

### Owner
- View, create, update, and delete their own vessels
- View, create, update, and delete surveys for their vessels
- View cargo shipments for their vessels
- View maintenance records for their vessels
- View crew records for their vessels

### Ship Management
- View and update vessels they manage
- View, create, update, and delete surveys for vessels they manage
- View cargo shipments for vessels they manage
- View, create, update, and delete maintenance records for vessels they manage
- View, create, update, and delete crew records for vessels they manage

### Cargo Manager
- View all vessels
- View all surveys
- View, create, update, and delete assigned cargo shipments
- View all maintenance and crew records