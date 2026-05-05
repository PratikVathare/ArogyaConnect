const dummyHospitals = [
  {
    id: 1,
    name: "Apollo Multispeciality Hospital",
    location: "Downtown Medical District",
    distance: "2.4 miles",
    rating: 4.8,
    specializations: ["Cardiology", "Neurology", "Orthopedics"],
    lat: 40.7128,
    lng: -74.0060
  },
  {
    id: 2,
    name: "St. John's Medical Center",
    location: "West End Square",
    distance: "5.1 miles",
    rating: 4.5,
    specializations: ["Pediatrics", "General Surgery", "Dermatology"],
    lat: 40.7200,
    lng: -73.9900
  },
  {
    id: 3,
    name: "Sunrise Healthcare",
    location: "Eastside Suburbs",
    distance: "1.2 miles",
    rating: 4.9,
    specializations: ["Oncology", "Psychiatry", "Urology"],
    lat: 40.7000,
    lng: -74.0100
  },
  {
    id: 4,
    name: "City General Hospital",
    location: "Central Park Ave",
    distance: "3.8 miles",
    rating: 4.2,
    specializations: ["ER", "Trauma", "Internal Medicine", "General Practice"],
    lat: 40.7300,
    lng: -73.9800
  },
  {
    id: 5,
    name: "Mercy Care Clinic",
    location: "North Hills",
    distance: "6.5 miles",
    rating: 4.7,
    specializations: ["Ophthalmology", "Dental", "ENT"],
    lat: 40.7400,
    lng: -73.9700
  },
  {
    id: 6,
    name: "Global Health Institute",
    location: "South Tech Park",
    distance: "8.0 miles",
    rating: 4.9,
    specializations: ["Cardiology", "Robotic Surgery"],
    lat: 40.7500,
    lng: -73.9600
  }
];

const getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lng, specialization } = req.query;

    let filtered = dummyHospitals;

    if (specialization) {
      filtered = filtered.filter(h => 
        h.specializations.some(s => s.toLowerCase() === specialization.toLowerCase())
      );
    }
    
    // If no hospitals matched the exact specialization, return a generic one or empty
    if (filtered.length === 0) {
      // Just fallback to City General Hospital for the demo
      filtered = [dummyHospitals[3]];
    }

    return res.status(200).json(filtered);
  } catch (err) {
    console.error('Error fetching nearby hospitals:', err);
    return res.status(500).json({ error: 'Failed to fetch nearby hospitals.' });
  }
};

module.exports = {
  getNearbyHospitals
};
