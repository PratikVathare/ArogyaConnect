import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, Star, Clock, Navigation, Calendar, Phone, Activity, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Haversine formula to calculate distance in miles
function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

// A component to recenter map when location changes
function MapUpdater({ center, zoom = 12 }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [center, map, zoom]);
  return null;
}

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col animate-pulse">
    <div className="h-40 bg-slate-200"></div>
    <div className="p-5 flex-1 flex flex-col gap-3">
      <div className="h-6 bg-slate-200 rounded w-3/4"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      <div className="flex gap-2 mt-2">
        <div className="h-5 bg-slate-200 rounded-full w-16"></div>
        <div className="h-5 bg-slate-200 rounded-full w-20"></div>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded w-20"></div>
        <div className="h-9 bg-slate-200 rounded-lg w-24"></div>
      </div>
    </div>
  </div>
);

export default function Hospitals() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]);
  const [activeHospitalId, setActiveHospitalId] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [locatingFinished, setLocatingFinished] = useState(false);
  
  const [bookingHospital, setBookingHospital] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  const markerRefs = useRef({});

  const checkAuth = () => {
    const token = localStorage.getItem('arogya_auth_token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const fetchLocationName = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
      if (res.ok) {
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.suburb || data.address.county || data.address.state || 'My Location';
        setSearchLocation(city);
        localStorage.setItem('arogya_user_city', city);
      }
    } catch (err) {
      console.error("Error reverse geocoding location:", err);
      setSearchLocation('My Location');
    }
  };

  const fetchHospitals = async (coords = null, cityTerm = null, specialtyTerm = null) => {
    setIsLoading(true);
    const token = localStorage.getItem('arogya_auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams(location.search);
    const urlSpecialty = specialtyTerm !== null ? specialtyTerm : (searchTerm || params.get('specialty') || '');
    const urlHospital = params.get('hospital') || '';

    let url = `http://127.0.0.1:3001/api/hospitals/nearby?`;
    const queryParams = new URLSearchParams();

    const activeCity = cityTerm !== null ? cityTerm : searchLocation;
    if (activeCity && activeCity.trim() !== '' && activeCity.toLowerCase() !== 'my location' && activeCity.toLowerCase() !== 'detecting location...') {
      queryParams.append('location', activeCity);
    } else {
      const activeCoords = coords || userLocation;
      if (activeCoords) {
        queryParams.append('lat', activeCoords[0]);
        queryParams.append('lng', activeCoords[1]);
      } else {
        queryParams.append('lat', '40.7128');
        queryParams.append('lng', '-74.0060');
      }
    }

    if (urlSpecialty) {
      queryParams.append('specialization', urlSpecialty);
    }

    try {
      const response = await fetch(url + queryParams.toString(), { headers });
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
        
        // Re-center map to first hospital
        if (data.length > 0) {
          setMapCenter([data[0].lat, data[0].lng]);
        }

        // If a specific hospital was clicked in suggested list, pre-select it and open booking!
        if (urlHospital && data.length > 0) {
          // Helper to extract clean keywords (removes common words like hospital, clinic, and, commas)
          const cleanWords = (str) => str.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w && !['hospital', 'clinic', 'center', 'and', 'healthcare', 'care'].includes(w));

          const urlWords = cleanWords(urlHospital);
          
          // 1. Try to find hospital with keyword overlap
          let matchedHospital = data.find(h => {
            const dbWords = cleanWords(h.name);
            return urlWords.some(w => dbWords.includes(w)) || dbWords.some(w => urlWords.includes(w));
          });

          // 2. Fallback to nearest hospital in list if no exact match found
          if (!matchedHospital) {
            matchedHospital = data[0];
          }

          if (matchedHospital && !isNaN(matchedHospital.lat) && !isNaN(matchedHospital.lng)) {
            setActiveHospitalId(matchedHospital.id);
            setMapCenter([matchedHospital.lat, matchedHospital.lng]);
            
            // Open booking modal automatically
            setBookingHospital(matchedHospital);
            setBookingSuccess(false);
            setApptDate('');
            setApptTime('');
            setApptNotes('Routine appointment requested via symptom checker.');
          }
        }
      }
    } catch (err) {
      console.error("Error fetching nearby hospitals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGPSLocate = () => {
    if (!checkAuth()) return;
    setSearchLocation('Detecting location...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
          localStorage.setItem('arogya_user_coords', JSON.stringify(loc));
          fetchLocationName(position.coords.latitude, position.coords.longitude);
          fetchHospitals(loc, 'My Location', searchTerm);
        },
        (error) => {
          console.error("GPS Locate failed", error);
          setSearchLocation('New York');
          fetchHospitals([40.7128, -74.0060], 'New York', searchTerm);
        },
        { timeout: 4000 }
      );
    } else {
      setSearchLocation('New York');
      fetchHospitals([40.7128, -74.0060], 'New York', searchTerm);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!checkAuth()) return;
    fetchHospitals(userLocation, searchLocation, searchTerm);
  };

  // Get user's geolocation or URL parameters on mount / URL change
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(location.search);
      const urlLat = parseFloat(params.get('lat'));
      const urlLng = parseFloat(params.get('lng'));
      const urlSpecialty = params.get('specialty') || '';

      if (urlSpecialty) {
        setSearchTerm(urlSpecialty);
      }

      let activeCoords = null;
      let activeCity = '';

      if (!isNaN(urlLat) && !isNaN(urlLng)) {
        activeCoords = [urlLat, urlLng];
        setUserLocation(activeCoords);
        setMapCenter(activeCoords);
        setLocatingFinished(true);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${urlLat}&lon=${urlLng}&zoom=10`);
          if (res.ok) {
            const data = await res.json();
            activeCity = data.address.city || data.address.town || data.address.suburb || data.address.county || data.address.state || 'My Location';
            setSearchLocation(activeCity);
          }
        } catch (e) {
          activeCity = 'My Location';
          setSearchLocation('My Location');
        }
        
        fetchHospitals(activeCoords, activeCity, urlSpecialty);
      } else {
        const cachedCoords = localStorage.getItem('arogya_user_coords');
        const cachedCity = localStorage.getItem('arogya_user_city');
        
        if (cachedCoords && cachedCity) {
          activeCoords = JSON.parse(cachedCoords);
          activeCity = cachedCity;
          setUserLocation(activeCoords);
          setMapCenter(activeCoords);
          setSearchLocation(activeCity);
          setLocatingFinished(true);
          fetchHospitals(activeCoords, activeCity, urlSpecialty);
        } else if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              activeCoords = [position.coords.latitude, position.coords.longitude];
              setUserLocation(activeCoords);
              setMapCenter(activeCoords);
              localStorage.setItem('arogya_user_coords', JSON.stringify(activeCoords));
              setLocatingFinished(true);
              
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${activeCoords[0]}&lon=${activeCoords[1]}&zoom=10`);
                if (res.ok) {
                  const data = await res.json();
                  activeCity = data.address.city || data.address.town || data.address.suburb || data.address.county || data.address.state || 'My Location';
                  setSearchLocation(activeCity);
                  localStorage.setItem('arogya_user_city', activeCity);
                }
              } catch (e) {
                activeCity = 'My Location';
                setSearchLocation('My Location');
              }
              
              fetchHospitals(activeCoords, activeCity, urlSpecialty);
            },
            (error) => {
              console.error("Error getting location", error);
              activeCoords = [40.7128, -74.0060];
              activeCity = 'New York';
              setUserLocation(activeCoords);
              setMapCenter(activeCoords);
              setSearchLocation(activeCity);
              setLocatingFinished(true);
              fetchHospitals(activeCoords, activeCity, urlSpecialty);
            },
            { timeout: 4000 }
          );
        } else {
          activeCoords = [40.7128, -74.0060];
          activeCity = 'New York';
          setUserLocation(activeCoords);
          setMapCenter(activeCoords);
          setSearchLocation(activeCity);
          setLocatingFinished(true);
          fetchHospitals(activeCoords, activeCity, urlSpecialty);
        }
      }
    };
    
    init();
  }, [location.search]);

  // Calculate dynamic distance and sort by proximity
  const hospitalsWithDynamicDistance = hospitals.map(h => {
    if (userLocation && h.lat && h.lng) {
      const dist = getDistanceInMiles(userLocation[0], userLocation[1], h.lat, h.lng);
      return { ...h, calculatedDistance: dist, distance: dist.toFixed(1) + " miles" };
    }
    return { ...h, calculatedDistance: h.calculatedDistance || Infinity };
  });

  const filteredHospitals = hospitalsWithDynamicDistance
    .filter(h => {
      if (!searchTerm) return true;
      
      const params = new URLSearchParams(location.search);
      const urlSpecialty = params.get('specialty') || '';
      
      // If search term matches the URL specialty parameter, we trust the backend's filtered/fallback results and display all
      if (searchTerm.toLowerCase() === urlSpecialty.toLowerCase()) {
        return true;
      }
      
      return (
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        h.specializations.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        h.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => a.calculatedDistance - b.calculatedDistance);

  const handleCardClick = (hospital) => {
    setActiveHospitalId(hospital.id);
    if (hospital.lat && hospital.lng) {
      setMapCenter([hospital.lat, hospital.lng]);
    }
    
    // Slight delay to allow map to start panning before opening popup
    setTimeout(() => {
      if (markerRefs.current[hospital.id]) {
        markerRefs.current[hospital.id].openPopup();
      }
    }, 300);
  };

  const handleBookClick = (e, hospital) => {
    e.stopPropagation(); // prevent card click event
    if (!checkAuth()) return;
    setBookingHospital(hospital);
    setBookingSuccess(false);
    setApptDate('');
    setApptTime('');
    setApptNotes('');
  };

  const confirmBooking = async () => {
    const token = localStorage.getItem('arogya_auth_token');
    try {
      // Combine date and time to ISO format
      let finalDate = new Date();
      if (apptDate && apptTime) {
        finalDate = new Date(`${apptDate}T${apptTime}`);
      } else if (apptDate) {
        finalDate = new Date(apptDate);
      }

      const response = await fetch('http://127.0.0.1:3001/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hospital_id: bookingHospital.id,
          hospital: {
            name: bookingHospital.name,
            location: bookingHospital.location,
            distance: bookingHospital.distance,
            rating: bookingHospital.rating,
            image_url: bookingHospital.image_url || bookingHospital.image,
            wait_time: bookingHospital.wait_time
          },
          doctor_id: 1, // Default mock doctor id
          appointment_date: finalDate.toISOString(),
          notes: apptNotes || 'Routine Checkup'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Booking failed');
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingHospital(null);
        setBookingSuccess(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while booking. Please try again.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 lg:px-8 relative">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: List and Filters */}
        <div className="w-full lg:w-1/2 xl:w-7/12 flex flex-col space-y-6">
          
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                Network Hospitals
              </h1>
              <p className="text-slate-500 mt-1 font-medium">Find and book appointments at verified healthcare facilities.</p>
            </div>
          </div>

          {/* Search Bar Block */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 transition-all hover:shadow-md focus-within:ring-2 ring-blue-500/10">
            {/* Input 1: Search Name/Specialty */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Hospital name or specialty..." 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                value={searchTerm}
                onChange={e => {
                  if (checkAuth()) setSearchTerm(e.target.value);
                }}
                onFocus={(e) => {
                  if (!checkAuth()) e.target.blur();
                }}
              />
            </div>

            {/* Input 2: Search Location */}
            <div className="relative flex-1 md:max-w-[320px]">
              <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
              <input 
                type="text" 
                placeholder="City, region, or 'My Location'..." 
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                value={searchLocation}
                onChange={e => {
                  if (checkAuth()) setSearchLocation(e.target.value);
                }}
                onFocus={(e) => {
                  if (!checkAuth()) e.target.blur();
                }}
              />
              {/* GPS Locate button */}
              <button
                type="button"
                onClick={handleGPSLocate}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                title="Locate Me"
              >
                <Navigation className="w-4 h-4 animate-pulse" />
              </button>
            </div>

            <button 
              type="submit"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 shrink-0">
              Search
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Hospital Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-8 overflow-y-auto pr-2" style={{ maxHeight: "calc(100vh - 240px)" }}>
            {isLoading ? (
              // Loading State
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <AnimatePresence>
                {filteredHospitals.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-12 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300"
                  >
                    <Search className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No hospitals found</h3>
                    <p className="text-slate-500">Try adjusting your search criteria or location.</p>
                  </motion.div>
                ) : (
                  filteredHospitals.map((hospital, index) => (
                    <motion.div 
                      key={hospital.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
                      onClick={() => handleCardClick(hospital)}
                      className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] hover:-translate-y-1.5 transition-all duration-300 border cursor-pointer flex flex-col group min-h-[440px] ${activeHospitalId === hospital.id ? 'border-blue-600 ring-4 ring-blue-100 bg-gradient-to-br from-blue-50/10 via-white to-white' : 'border-slate-100 hover:border-blue-200'}`}
                    >
                      <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0">
                        <img 
                          src={hospital.image || hospital.image_url || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600&h=400'} 
                          alt={hospital.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                        
                        {/* Floating Distance Badge */}
                        <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-lg border border-blue-500/30 text-white">
                          <Navigation className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-black uppercase tracking-wide">{hospital.distance}</span>
                        </div>

                        {/* Floating Rating Badge */}
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                          <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                          <span className="text-sm font-bold text-slate-800">{hospital.rating}</span>
                        </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-extrabold text-slate-800 mb-3 group-hover:text-blue-700 leading-snug transition-colors line-clamp-2" title={hospital.name}>
                          {hospital.name}
                        </h3>
                        
                        <div className="flex flex-col gap-2.5 mb-5 flex-1">
                          <div className="flex items-start gap-2.5 text-slate-500 text-sm">
                            <MapPin className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
                            <span className="font-semibold text-slate-700 leading-normal">{hospital.location}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-slate-500 text-sm">
                            <Phone className="w-4 h-4 shrink-0 text-green-600" />
                            <span className="font-medium text-slate-600">+1 (555) 123-4567</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {hospital.specializations.slice(0, 3).map((spec, i) => (
                            <span key={i} className="px-2.5 py-1 bg-blue-50/80 text-blue-700 rounded-lg text-[10px] font-bold tracking-wide uppercase border border-blue-100/50 shadow-sm">
                              {spec}
                            </span>
                          ))}
                          {hospital.specializations.length > 3 && (
                             <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold tracking-wide uppercase border border-slate-200">
                               +{hospital.specializations.length - 3}
                             </span>
                          )}
                        </div>

                        <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Wait Time</span>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                              <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                              <span className="text-orange-600 font-black">{hospital.wait_time}</span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => handleBookClick(e, hospital)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-black rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5 uppercase tracking-wider"
                          >
                            <Calendar className="w-4 h-4" />
                            Book Visit
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="w-full lg:w-1/2 xl:w-5/12 z-0">
          <div className="sticky top-28 h-[calc(100vh-140px)] w-full rounded-[2rem] overflow-hidden shadow-lg border-4 border-white bg-slate-100 z-0 relative">
            
            {isLoading && (
              <div className="absolute inset-0 z-50 bg-slate-100 animate-pulse flex items-center justify-center">
                <MapPin className="w-12 h-12 text-slate-300 animate-bounce" />
              </div>
            )}

            {mapCenter && (
              <MapContainer 
                center={[40.7128, -74.0060]} 
                zoom={12} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapUpdater center={mapCenter} />

                {userLocation && Array.isArray(userLocation) && !isNaN(userLocation[0]) && !isNaN(userLocation[1]) && (
                  <Marker position={userLocation}>
                    <Popup className="rounded-xl">
                      <div className="font-bold text-blue-600 p-1">📍 You are here</div>
                    </Popup>
                  </Marker>
                )}

                {filteredHospitals.map((hospital) => {
                  if (hospital.lat && hospital.lng) {
                    return (
                      <Marker 
                        key={hospital.id} 
                        position={[hospital.lat, hospital.lng]}
                        ref={(ref) => markerRefs.current[hospital.id] = ref}
                        eventHandlers={{
                          click: () => setActiveHospitalId(hospital.id)
                        }}
                      >
                        <Popup>
                          <div className="p-1 min-w-[140px]">
                            <div className="font-bold text-sm mb-1 text-slate-800">{hospital.name}</div>
                            <div className="text-xs text-slate-500 font-semibold mb-3 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-500" />
                              {hospital.distance} away
                            </div>
                            <button 
                              onClick={(e) => handleBookClick(e, hospital)}
                              className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                            >
                              Book Now
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}
              </MapContainer>
            )}
          </div>
        </div>
        
      </div>

      {/* Booking Modal */}
      {bookingHospital && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setBookingHospital(null)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative z-10"
          >
            {!bookingSuccess ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Book Visit</h2>
                      <p className="text-slate-500 text-sm font-medium">Schedule your appointment</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-1">{bookingHospital.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {bookingHospital.location}</p>
                </div>
                
                <div className="space-y-5 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Date</label>
                      <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        value={apptDate}
                        onChange={(e) => setApptDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Time</label>
                      <input 
                        type="time" 
                        value={apptTime}
                        onChange={(e) => setApptTime(e.target.value)}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Reason for Visit</label>
                    <textarea 
                      placeholder="Briefly describe your symptoms..." 
                      value={apptNotes}
                      onChange={(e) => setApptNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 resize-none h-24 shadow-sm"
                    ></textarea>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setBookingHospital(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmBooking}
                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    Confirm Booking
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner"
                >
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </motion.div>
                <h2 className="text-3xl font-extrabold text-slate-800 mb-3">Confirmed!</h2>
                <p className="text-slate-600 mb-6 text-lg">Your appointment at <strong className="text-slate-800">{bookingHospital.name}</strong> is scheduled.</p>
                <div className="bg-slate-50 rounded-xl p-4 w-full">
                  <p className="text-sm text-slate-500 font-medium">A confirmation email has been sent to your registered address.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
