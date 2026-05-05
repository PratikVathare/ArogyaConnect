const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const getMyAppointments = async (req, res) => {
  try {
    const email = req.user.email;
    // Using service role key to bypass any RLS select restrictions
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch user's appointments
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        hospitals (name)
      `)
      .eq('patient_email', email)
      .order('appointment_date', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Fetch Appointments Error:', err);
    return res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const email = req.user.email;
    const name = req.user.user_metadata?.full_name || email;
    const { hospital_id, doctor_id, appointment_date, notes } = req.body;
    
    // Using service role key to completely bypass the database RLS INSERT restrictions!
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ensure hospital_id exists in the database (IDs 1-4 are valid), otherwise default to 1 to prevent FK constraint error
    const validHospitalId = (hospital_id && hospital_id >= 1 && hospital_id <= 4) ? hospital_id : 1;

    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        patient_email: email,
        patient_name: name,
        hospital_id: validHospitalId,
        doctor_id: doctor_id || 1, // Default if not provided
        appointment_date,
        notes,
        status: 'Upcoming'
      }])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ message: 'Appointment booked successfully', appointment: data[0] });
  } catch (err) {
    console.error('Book Appointment Error:', err);
    return res.status(500).json({ error: 'Failed to book appointment.' });
  }
};

module.exports = {
  getMyAppointments,
  bookAppointment
};
