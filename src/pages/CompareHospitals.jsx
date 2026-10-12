import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Scale,
  MapPin,
  Star,
  Clock,
  Navigation,
  Calendar,
  Phone,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  IndianRupee,
  Activity,
  Award,
  Plus,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  X,
  Building2,
  HelpCircle,
  ThumbsUp,
  HeartHandshake
} from 'lucide-react';

export default function CompareHospitals() {
  const navigate = useNavigate();
  const location = useLocation();

  // Location and real-time hospitals state
  const [searchLocation, setSearchLocation] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [allHospitals, setAllHospitals] = useState([]);
  const [selectedHospitalIds, setSelectedHospitalIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Range and filter preferences for smart selection
  const [maxConsultFee, setMaxConsultFee] = useState(2000);
  const [maxWaitTime, setMaxWaitTime] = useState(60);
  const [minRating, setMinRating] = useState(4.0);
  const [filterTier, setFilterTier] = useState('ALL'); // ALL, Budget-Friendly, Moderate, Premium Tertiary
  const [requiredFacility, setRequiredFacility] = useState('ALL'); // ALL, icu, emergency, cashless, mri

  // Appointment booking modal state
  const [bookingHospital, setBookingHospital] = useState(null);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  const checkAuth = () => {
    const token = localStorage.getItem('arogya_auth_token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  // Reverse geocode lat/lng to city name
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

  // Fetch real-time hospitals from the backend
  const fetchRealTimeHospitals = async (coords = null, cityTerm = null) => {
    setIsLoading(true);
    const token = localStorage.getItem('arogya_auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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

    try {
      const response = await fetch(url + queryParams.toString(), { headers });
      if (response.ok) {
        const data = await response.json();
        setAllHospitals(data);

        // Check if pre-selected IDs were passed in location state
        const preSelected = location.state?.selectedHospitalIds;
        if (preSelected && Array.isArray(preSelected) && preSelected.length > 0) {
          // Keep only IDs that exist in data, or take top 2 from preSelected
          const validIds = preSelected.filter(id => data.some(h => String(h.id) === String(id)));
          if (validIds.length >= 2) {
            setSelectedHospitalIds(validIds.slice(0, 4));
          } else if (validIds.length === 1 && data.length > 1) {
            const secondId = data.find(h => String(h.id) !== String(validIds[0]))?.id;
            setSelectedHospitalIds([validIds[0], secondId].filter(Boolean));
          } else {
            setSelectedHospitalIds(data.slice(0, 3).map(h => h.id));
          }
        } else if (selectedHospitalIds.length === 0 && data.length > 0) {
          // Default: compare the first 2-3 real-time hospitals
          setSelectedHospitalIds(data.slice(0, Math.min(3, data.length)).map(h => h.id));
        }
      }
    } catch (err) {
      console.error("Error fetching real-time hospitals for comparison:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGPSLocate = () => {
    setSearchLocation('Detecting location...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          localStorage.setItem('arogya_user_coords', JSON.stringify(loc));
          fetchLocationName(position.coords.latitude, position.coords.longitude);
          fetchRealTimeHospitals(loc, 'My Location');
        },
        (error) => {
          console.error("GPS Locate failed", error);
          setSearchLocation('New York');
          fetchRealTimeHospitals([40.7128, -74.0060], 'New York');
        },
        { timeout: 5000 }
      );
    } else {
      setSearchLocation('New York');
      fetchRealTimeHospitals([40.7128, -74.0060], 'New York');
    }
  };

  const handleLocationSubmit = (e) => {
    if (e) e.preventDefault();
    fetchRealTimeHospitals(userLocation, searchLocation);
  };

  // Initial load
  useEffect(() => {
    const cachedCoords = localStorage.getItem('arogya_user_coords');
    const cachedCity = localStorage.getItem('arogya_user_city');

    if (cachedCoords && cachedCity) {
      const coords = JSON.parse(cachedCoords);
      setUserLocation(coords);
      setSearchLocation(cachedCity);
      fetchRealTimeHospitals(coords, cachedCity);
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          localStorage.setItem('arogya_user_coords', JSON.stringify(loc));
          fetchLocationName(position.coords.latitude, position.coords.longitude);
          fetchRealTimeHospitals(loc, 'My Location');
        },
        () => {
          setSearchLocation('New York');
          fetchRealTimeHospitals([40.7128, -74.0060], 'New York');
        },
        { timeout: 5000 }
      );
    } else {
      setSearchLocation('New York');
      fetchRealTimeHospitals([40.7128, -74.0060], 'New York');
    }
  }, []);

  // Filter hospitals to display in comparison
  const comparedHospitals = allHospitals.filter(h => selectedHospitalIds.includes(h.id));

  // Determine winners across comparison points for smart badges
  const lowestFee = comparedHospitals.length > 0 
    ? Math.min(...comparedHospitals.map(h => h.treatment_cost?.consultation_fee || 9999)) 
    : 0;

  const fastestWait = comparedHospitals.length > 0 
    ? Math.min(...comparedHospitals.map(h => h.waiting_time?.wait_time_raw_mins || 999)) 
    : 0;

  const highestRating = comparedHospitals.length > 0 
    ? Math.max(...comparedHospitals.map(h => h.rating || 0)) 
    : 0;

  const mostExperienced = comparedHospitals.length > 0 
    ? Math.max(...comparedHospitals.map(h => h.doctor_experience?.avg_years || 0)) 
    : 0;

  // Toggle hospital selection
  const toggleSelectHospital = (id) => {
    if (selectedHospitalIds.includes(id)) {
      if (selectedHospitalIds.length <= 1) {
        alert("Please keep at least 1 hospital in the comparison.");
        return;
      }
      setSelectedHospitalIds(selectedHospitalIds.filter(item => item !== id));
    } else {
      if (selectedHospitalIds.length >= 4) {
        alert("You can compare up to 4 hospitals simultaneously for optimal visibility.");
        return;
      }
      setSelectedHospitalIds([...selectedHospitalIds, id]);
    }
  };

  // Check if hospital fits within patient's preferred range
  const matchesPatientRange = (h) => {
    const feeMatch = (h.treatment_cost?.consultation_fee || 0) <= maxConsultFee;
    const waitMatch = (h.waiting_time?.wait_time_raw_mins || 0) <= maxWaitTime;
    const ratingMatch = (h.rating || 0) >= minRating;
    const tierMatch = filterTier === 'ALL' || h.treatment_cost?.pricing_tier === filterTier;
    let facilityMatch = true;
    if (requiredFacility === 'icu') facilityMatch = h.facilities?.has_icu;
    if (requiredFacility === 'emergency') facilityMatch = h.facilities?.has_emergency;
    if (requiredFacility === 'cashless') facilityMatch = h.facilities?.has_cashless;
    if (requiredFacility === 'mri') facilityMatch = h.facilities?.has_mri_ct;

    return feeMatch && waitMatch && ratingMatch && tierMatch && facilityMatch;
  };

  // Appointment booking submission
  const confirmBooking = async () => {
    if (!checkAuth()) return;
    setIsBookingSubmitting(true);
    const token = localStorage.getItem('arogya_auth_token');
    try {
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
          doctor_id: 1,
          appointment_date: finalDate.toISOString(),
          notes: apptNotes || 'Booked via Smart Multi-Hospital Comparison'
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
      }, 2200);
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while booking. Please try again.");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 lg:px-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 lg:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold tracking-wider uppercase mb-3 border border-blue-400/20">
                <Scale className="w-4 h-4" /> Real-Time Multi-Hospital Comparison
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
                Compare Hospitals & Make Smart Healthcare Decisions
              </h1>
              <p className="text-slate-300 mt-2 max-w-2xl text-sm lg:text-base leading-relaxed">
                Objective, transparent side-by-side analysis of verified network hospitals based on Treatment Cost, Facilities, Ratings, Doctor Experience, and Wait Times.
              </p>
            </div>

            {/* Real-time Location Form */}
            <form onSubmit={handleLocationSubmit} className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 w-full lg:w-auto shadow-inner">
              <div className="relative flex-1 lg:w-72">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400" />
                <input
                  type="text"
                  placeholder="Enter city or location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-transparent text-white placeholder-slate-400 text-sm font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGPSLocate}
                  title="Detect GPS Location"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-white transition-colors"
                >
                  <Navigation className="w-4 h-4 animate-pulse" />
                </button>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
              >
                Fetch Live
              </button>
            </form>
          </div>
        </div>

        {/* Range & Preference Controls ("Select Your Appropriate Range") */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Select Your Appropriate Range</h2>
                <p className="text-xs text-slate-500 font-medium">Customize budget, acceptable wait time, and required facilities to identify your best fit.</p>
              </div>
            </div>

            {/* Add Hospital Button */}
            <button
              onClick={() => setIsSelectorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add / Change Hospital ({comparedHospitals.length}/4)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Range 1: Max Consultation Fee */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
                <span>Max Consultation Fee</span>
                <span className="text-blue-600 font-extrabold">₹{maxConsultFee}</span>
              </div>
              <input
                type="range"
                min="400"
                max="2500"
                step="50"
                value={maxConsultFee}
                onChange={(e) => setMaxConsultFee(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>₹400 (Budget)</span>
                <span>₹2,500 (Tertiary)</span>
              </div>
            </div>

            {/* Range 2: Max OPD Wait Time */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
                <span>Max OPD Wait Time</span>
                <span className="text-orange-600 font-extrabold">{maxWaitTime} mins</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={maxWaitTime}
                onChange={(e) => setMaxWaitTime(Number(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>10 mins (Urgent)</span>
                <span>60 mins (Standard)</span>
              </div>
            </div>

            {/* Range 3: Pricing Tier Filter */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <label className="text-xs font-bold text-slate-600 block mb-2">Target Pricing Tier</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Pricing Categories</option>
                <option value="Budget-Friendly">Budget-Friendly (Govt / Trust)</option>
                <option value="Moderate">Moderate (Standard Private)</option>
                <option value="Premium Tertiary">Premium Tertiary Super-Specialty</option>
              </select>
            </div>

            {/* Range 4: Key Required Facility */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <label className="text-xs font-bold text-slate-600 block mb-2">Must-Have Facility</label>
              <select
                value={requiredFacility}
                onChange={(e) => setRequiredFacility(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Any Standard Facility</option>
                <option value="icu">Intensive Care Unit (ICU)</option>
                <option value="emergency">24/7 Emergency & Trauma</option>
                <option value="cashless">Cashless Insurance / TPA</option>
                <option value="mri">Advanced 3T MRI & CT Scan</option>
              </select>
            </div>
          </div>

          {/* Active Compared Hospital Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Comparing:</span>
            {comparedHospitals.map(h => (
              <span
                key={h.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200 shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="max-w-[150px] truncate">{h.name}</span>
                <button
                  onClick={() => toggleSelectHospital(h.id)}
                  className="hover:text-red-600 ml-1 p-0.5 transition-colors"
                  title="Remove from comparison"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {comparedHospitals.length < 4 && (
              <button
                onClick={() => setIsSelectorOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-all border border-dashed border-slate-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add Hospital
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-lg font-bold text-slate-800">Fetching Real-Time Hospital Comparison Data...</h3>
            <p className="text-sm text-slate-500">Querying real-time network hospitals and pricing indexes for {searchLocation || 'your location'}.</p>
          </div>
        ) : comparedHospitals.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4">
            <Scale className="w-16 h-16 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-800">No Hospitals Selected for Comparison</h3>
            <p className="text-slate-500 max-w-md text-sm">Please select at least 2 real-time hospitals from the network to view a complete side-by-side analysis.</p>
            <button
              onClick={() => setIsSelectorOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all text-sm"
            >
              Select Real-Time Hospitals
            </button>
          </div>
        ) : (
          /* Main Side-by-Side Comparison Container */
          <div className="space-y-6">

            {/* Smart Decision Summary Banner */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    Smart & Transparent Decision Engine
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">Active</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Compare points automatically highlight key differentiators: <strong className="text-emerald-700">Lowest Fee</strong>, <strong className="text-orange-700">Shortest Wait</strong>, <strong className="text-blue-700">Top Experience</strong>, and <strong className="text-indigo-700">Full Facilities</strong> to empower patients with transparent healthcare choices.
                  </p>
                </div>
              </div>
              <Link
                to="/hospitals"
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                Browse Map View
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Side-by-Side Comparison Grid */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-x-auto">
              <div className="min-w-[850px]">
                
                {/* 1. Header Row (Cards with Images, Names, Rating, and CTA) */}
                <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50/50">
                  <div className="col-span-3 p-6 flex flex-col justify-end border-r border-slate-100">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Comparison Criteria</span>
                    <h3 className="text-xl font-black text-slate-800 mt-1">Network Hospitals</h3>
                    <p className="text-xs text-slate-500 mt-1">Real-time parameters derived from current location data.</p>
                  </div>

                  <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                    {comparedHospitals.map(h => {
                      const isRangeMatch = matchesPatientRange(h);
                      return (
                        <div key={h.id} className="p-5 flex flex-col relative group">
                          {/* Close button */}
                          <button
                            onClick={() => toggleSelectHospital(h.id)}
                            className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-red-50 hover:text-red-600 rounded-full text-slate-400 backdrop-blur shadow-sm transition-all z-10"
                            title="Remove from comparison"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Hospital Image */}
                          <div className="h-32 rounded-2xl overflow-hidden relative mb-4 shadow-sm bg-slate-100">
                            <img
                              src={h.image || h.image_url || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600&h=400'}
                              alt={h.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                            
                            {/* Proximity Badge */}
                            <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-blue-600/90 text-white text-[10px] font-black tracking-wide uppercase backdrop-blur flex items-center gap-1">
                              <Navigation className="w-3 h-3" /> {h.distance}
                            </span>
                          </div>

                          {/* Smart Decision Winner Badge */}
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-extrabold tracking-wide uppercase border border-indigo-100">
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              {h.smart_decision?.badge || 'Verified Network'}
                            </span>
                          </div>

                          {/* Name & Location */}
                          <h4 className="font-extrabold text-slate-900 text-base line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors" title={h.name}>
                            {h.name}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            {h.location}
                          </p>

                          {/* Appropriate Range Fit Tag */}
                          <div className="mt-3 mb-4">
                            {isRangeMatch ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Fits Your Range Filter
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-medium border border-amber-200">
                                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                                Outside Active Filter
                              </span>
                            )}
                          </div>

                          {/* Direct Book CTA */}
                          <button
                            onClick={() => {
                              if (checkAuth()) {
                                setBookingHospital(h);
                                setBookingSuccess(false);
                                setApptDate('');
                                setApptTime('');
                                setApptNotes(`Booked from Multi-Hospital Comparison comparison table.`);
                              }
                            }}
                            className="w-full mt-auto py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Book Visit
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ---------------- SECTION 1: TREATMENT COST ---------------- */}
                <div className="border-b border-slate-100">
                  <div className="bg-slate-100/60 px-6 py-3 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">1. Treatment Cost & Affordability</span>
                  </div>

                  {/* Sub-row: OPD Consultation Fee */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center justify-between border-r border-slate-100">
                      <span>OPD Consultation Fee</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Per Visit</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => {
                        const fee = h.treatment_cost?.consultation_fee || 0;
                        const isLowest = fee === lowestFee;
                        return (
                          <div key={h.id} className="p-4 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-black text-slate-900">{h.treatment_cost?.consultation_formatted}</span>
                              {isLowest && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                                  Lowest
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5">Verified Doctor Fee</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-row: Pricing Tier */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Cost Category / Tier</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 flex items-center">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            h.treatment_cost?.pricing_tier === 'Budget-Friendly'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : h.treatment_cost?.pricing_tier === 'Moderate'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {h.treatment_cost?.pricing_tier}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: General Ward Bed */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>General Bed Daily Rate</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 font-bold text-slate-800">
                          {h.treatment_cost?.general_ward_formatted}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: ICU Daily Rate */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>ICU Bed Daily Rate</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 font-bold text-slate-800">
                          {h.treatment_cost?.icu_formatted}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Minor Procedure / Surgery Range */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Surgery / Inpatient Estimate</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 text-xs font-semibold text-slate-700">
                          {h.treatment_cost?.surgery_estimate_formatted}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Cashless Insurance TPA Desk */}
                  <div className="grid grid-cols-12 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Cashless Insurance Support</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 flex items-center gap-2">
                          {h.treatment_cost?.cashless_insurance ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Accepted (TPA Desk Active)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                              <XCircle className="w-4 h-4 text-slate-400" />
                              Reimbursement Only
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ---------------- SECTION 2: FACILITIES ---------------- */}
                <div className="border-b border-slate-100">
                  <div className="bg-slate-100/60 px-6 py-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">2. Medical Facilities & Infrastructure</span>
                  </div>

                  {/* Sub-row: 24/7 Emergency */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>24/7 Emergency & Trauma</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 flex items-center">
                          {h.facilities?.has_emergency ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Available 24x7
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                              <XCircle className="w-4 h-4 text-slate-300" /> Day Shift Only
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Intensive Care Unit (ICU) */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Intensive Care Unit (ICU)</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 flex items-center">
                          {h.facilities?.has_icu ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Equipped ICU
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                              <XCircle className="w-4 h-4 text-slate-300" /> Not Available
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Advanced 3T MRI & CT Scan */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Advanced CT & MRI Diagnostics</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 flex items-center">
                          {h.facilities?.has_mri_ct ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> In-house 3T Imaging
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                              <XCircle className="w-4 h-4 text-slate-300" /> External Partner
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Blood Bank */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Blood Bank & Component Lab</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 flex items-center">
                          {h.facilities?.has_blood_bank ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dedicated Unit
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                              <XCircle className="w-4 h-4 text-slate-300" /> On-Call Red Cross
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Total Verified Facility List */}
                  <div className="grid grid-cols-12 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Total Verified Facilities</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-extrabold text-blue-700">{h.facilities?.count || 7} Facilities</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(h.facilities?.items || []).slice(0, 3).map((f, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                {f}
                              </span>
                            ))}
                            {(h.facilities?.items || []).length > 3 && (
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                                +{(h.facilities?.items || []).length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ---------------- SECTION 3: RATINGS & PATIENT FEEDBACK ---------------- */}
                <div className="border-b border-slate-100">
                  <div className="bg-slate-100/60 px-6 py-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">3. Ratings & Patient Satisfaction</span>
                  </div>

                  {/* Sub-row: Overall Rating */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Overall Star Rating</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => {
                        const isTopRated = h.rating === highestRating;
                        return (
                          <div key={h.id} className="p-4 flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="text-sm font-black">{h.rating} / 5.0</span>
                            </div>
                            {isTopRated && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase">
                                Top Rated
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-row: Patient Satisfaction Percentage */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Patient Satisfaction</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-slate-800">
                            {h.ratings_detail?.patient_satisfaction_pct || 94}% Positive Feedback
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Total Verified Reviews */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Verified Review Count</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 text-xs font-semibold text-slate-600">
                          {h.ratings_detail?.review_count?.toLocaleString() || '450+'} verified patients
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Cleanliness & Hygiene */}
                  <div className="grid grid-cols-12 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Hygiene & Cleanliness Score</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                          <span>{h.ratings_detail?.cleanliness || '4.5'} / 5.0</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ---------------- SECTION 4: DOCTOR EXPERIENCE ---------------- */}
                <div className="border-b border-slate-100">
                  <div className="bg-slate-100/60 px-6 py-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">4. Doctor Experience & Accreditations</span>
                  </div>

                  {/* Sub-row: Average Doctor Experience */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Average Specialist Experience</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => {
                        const isMostExp = h.doctor_experience?.avg_years === mostExperienced;
                        return (
                          <div key={h.id} className="p-4 flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {h.doctor_experience?.years_label || '14+ Years Experience'}
                            </span>
                            {isMostExp && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-black rounded-full uppercase">
                                Most Exp.
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-row: Senior Consultants on Staff */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Senior Consultants on Staff</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 text-xs font-bold text-slate-700">
                          {h.doctor_experience?.senior_consultants_count || 12} Senior Surgeons & Physicians
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Certifications & Accreditations */}
                  <div className="grid grid-cols-12 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Quality Accreditations</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 flex flex-wrap gap-1.5">
                          {(h.doctor_experience?.accreditations || ['NABH Certified', 'NABL Lab']).map((acc, i) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200">
                              {acc}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ---------------- SECTION 5: WAITING TIME ---------------- */}
                <div className="border-b border-slate-100">
                  <div className="bg-slate-100/60 px-6 py-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">5. Waiting Time & Triage Speed</span>
                  </div>

                  {/* Sub-row: OPD Consultation Wait Time */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>OPD Consultation Wait</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => {
                        const waitMins = h.waiting_time?.wait_time_raw_mins || 30;
                        const isFastest = waitMins === fastestWait;
                        return (
                          <div key={h.id} className="p-4 flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {h.waiting_time?.opd_wait || h.wait_time}
                            </span>
                            {isFastest && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                                Fastest
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-row: Emergency Triage Wait */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Emergency Triage Response</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 text-xs font-extrabold text-orange-600">
                          {h.waiting_time?.emergency_wait || '5-10 mins'}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Bed Admission Turnaround */}
                  <div className="grid grid-cols-12 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Bed Allocation Turnaround</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4 text-xs font-semibold text-slate-600">
                          {h.waiting_time?.bed_turnaround || '< 30 mins'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ---------------- SECTION 6: SMART & TRANSPARENT DECISION MAKING ---------------- */}
                <div className="bg-gradient-to-b from-indigo-50/30 via-white to-white">
                  <div className="bg-indigo-900 text-white px-6 py-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider">6. Enables Smart & Transparent Decision Making</span>
                  </div>

                  {/* Sub-row: Transparency Score */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Arogya Transparency Score</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                              {h.smart_decision?.transparency_score || 95}
                            </div>
                            <span className="text-xs font-bold text-slate-700">/ 100 Verified</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Smart Verdict Rationale */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Smart Recommendation</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4">
                          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                            "{h.smart_decision?.verdict}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-row: Best Suited For */}
                  <div className="grid grid-cols-12 border-b border-slate-100 text-sm">
                    <div className="col-span-3 p-4 px-6 font-bold text-slate-700 bg-slate-50/40 flex items-center border-r border-slate-100">
                      <span>Best Suited For</span>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-slate-100`}>
                      {comparedHospitals.map(h => (
                        <div key={h.id} className="p-4">
                          <span className="inline-block text-xs font-bold text-indigo-900 bg-indigo-50/80 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                            {h.smart_decision?.best_suited_for}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Action Row: Direct Booking CTA for each column */}
                  <div className="grid grid-cols-12 p-6 bg-slate-50/80">
                    <div className="col-span-3 flex flex-col justify-center pr-6">
                      <span className="text-sm font-extrabold text-slate-800">Ready to Book?</span>
                      <p className="text-xs text-slate-500 mt-0.5">Secure your verified appointment with zero upfront deposit.</p>
                    </div>
                    <div className={`col-span-9 grid ${comparedHospitals.length === 2 ? 'grid-cols-2' : comparedHospitals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-4`}>
                      {comparedHospitals.map(h => (
                        <button
                          key={h.id}
                          onClick={() => {
                            if (checkAuth()) {
                              setBookingHospital(h);
                              setBookingSuccess(false);
                              setApptDate('');
                              setApptTime('');
                              setApptNotes('Booked via Multi-Hospital Comparison table.');
                            }
                          }}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                          <Calendar className="w-4 h-4" /> Book at {h.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* ---------------- HOSPITAL SELECTOR MODAL / DRAWER ---------------- */}
      <AnimatePresence>
        {isSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">Select Hospitals to Compare</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose 2 to 4 real-time hospitals from {searchLocation || 'your region'}.
                  </p>
                </div>
                <button
                  onClick={() => setIsSelectorOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Hospital List */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1">
                {allHospitals.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-8">No hospitals found for this location.</p>
                ) : (
                  allHospitals.map(h => {
                    const isSelected = selectedHospitalIds.includes(h.id);
                    return (
                      <div
                        key={h.id}
                        onClick={() => toggleSelectHospital(h.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={h.image || h.image_url || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=150'}
                            alt={h.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{h.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Navigation className="w-3 h-3 text-blue-600" /> {h.distance}
                              </span>
                              <span className="flex items-center gap-1 font-bold text-slate-700">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {h.rating}
                              </span>
                              <span className="text-emerald-700 font-extrabold">
                                {h.treatment_cost?.consultation_formatted} OPD
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Added
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">
                              <Plus className="w-3.5 h-3.5" /> Add
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  {selectedHospitalIds.length} of 4 hospitals selected
                </span>
                <button
                  onClick={() => setIsSelectorOpen(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                >
                  Apply Comparison View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- APPOINTMENT BOOKING MODAL ---------------- */}
      <AnimatePresence>
        {bookingHospital && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 lg:p-8 shadow-2xl relative border border-slate-100"
            >
              <button
                onClick={() => setBookingHospital(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Visit Scheduled!</h3>
                  <p className="text-slate-500 mt-2 text-sm">
                    Your appointment request at <strong>{bookingHospital.name}</strong> has been confirmed. You will receive an SMS and email notification shortly.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">Fast Track Appointment</span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">Book at {bookingHospital.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> {bookingHospital.location}
                    </p>
                  </div>

                  {/* Pricing transparency note */}
                  <div className="bg-blue-50/80 border border-blue-100 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Verified Consultation Fee:</span>
                      <strong className="text-slate-900 ml-1.5 font-bold">
                        {bookingHospital.treatment_cost?.consultation_formatted || 'Standard'}
                      </strong>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-black text-[10px] uppercase">
                      Transparent
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Preferred Date</label>
                      <input
                        type="date"
                        required
                        value={apptDate}
                        onChange={(e) => setApptDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Preferred Time Slot</label>
                      <input
                        type="time"
                        required
                        value={apptTime}
                        onChange={(e) => setApptTime(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Symptoms or Notes</label>
                      <textarea
                        rows="2"
                        placeholder="Routine checkup, cardiology consultation, etc."
                        value={apptNotes}
                        onChange={(e) => setApptNotes(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      ></textarea>
                    </div>
                  </div>

                  <button
                    onClick={confirmBooking}
                    disabled={isBookingSubmitting}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {isBookingSubmitting ? 'Confirming...' : 'Confirm Appointment Booking'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
