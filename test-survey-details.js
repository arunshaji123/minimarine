// Test data for survey details modal
const sampleSurvey = {
  _id: "60f7b8b8e8b8b8b8b8b8b8b8",
  title: "Annual Hull Inspection",
  vessel: {
    name: "MV Ocean Navigator",
    imoNumber: "IMO1234567"
  },
  surveyType: "Annual",
  surveyor: {
    name: "John Smith",
    email: "john.smith@surveyor.com"
  },
  requestedBy: {
    name: "Marine Corp Ltd",
    email: "info@marinecorp.com"
  },
  scheduledDate: "2023-06-15T00:00:00.000Z",
  completionDate: "2023-06-16T00:00:00.000Z",
  location: {
    port: "Port of Singapore",
    country: "Singapore"
  },
  status: "Completed",
  hullInspection: 4,
  hullInspectionFindings: "Minor corrosion observed on hull plating near waterline. No structural defects found.",
  deckSuperstructure: 5,
  deckSuperstructureFindings: "Excellent condition. All deck equipment properly secured and maintained.",
  machineryEngineRoom: 3,
  machineryEngineRoomFindings: "Main engine shows signs of wear. Oil leak detected from port generator. Recommended immediate repair.",
  electricalSystems: 4,
  electricalSystemsFindings: "Most systems functioning properly. Minor issues with navigation lights circuit breaker.",
  safetyEquipment: 5,
  safetyEquipmentFindings: "All safety equipment in excellent condition and up to date.",
  navigationEquipment: 4,
  navigationEquipmentFindings: "RADAR system requires calibration. GPS functioning normally.",
  pollutionControlSystems: 5,
  pollutionControlSystemsFindings: "Oil water separator functioning properly. All pollution prevention equipment compliant.",
  certificatesVerification: 4,
  certificatesVerificationFindings: "Most certificates valid. Safety Equipment Certificate expires in 3 months.",
  findings: [
    {
      category: "Structural",
      description: "Minor corrosion on hull plating",
      severity: "Minor",
      location: "Waterline, port side",
      status: "Open"
    },
    {
      category: "Machinery",
      description: "Oil leak from port generator",
      severity: "Major",
      location: "Engine room, port side",
      status: "Open"
    }
  ],
  recommendations: "1. Schedule hull painting to address corrosion\n2. Repair generator oil leak immediately\n3. Calibrate RADAR system\n4. Renew Safety Equipment Certificate before expiry",
  notes: "Overall vessel condition is good. Crew is well-trained and safety conscious."
};

console.log("Sample survey data for testing:");
console.log(JSON.stringify(sampleSurvey, null, 2));