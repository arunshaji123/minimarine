// Export all models from a single file for easier imports
const User = require('./User');
const Vessel = require('./Vessel');
const Survey = require('./Survey');
const Cargo = require('./Cargo');
const Maintenance = require('./Maintenance');
const Crew = require('./Crew');
const Document = require('./Document');
const Shipment = require('./Shipment');
const SurveyorBooking = require('./SurveyorBooking');
const CargoManagerBooking = require('./CargoManagerBooking');
const ServiceRequest = require('./ServiceRequest');

module.exports = {
  User,
  Vessel,
  Survey,
  Cargo,
  Maintenance,
  Crew,
  Document,
  Shipment,
  SurveyorBooking,
  CargoManagerBooking,
  ServiceRequest
};