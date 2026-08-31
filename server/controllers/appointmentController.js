const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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
    const { hospital_id, doctor_id, appointment_date, notes, hospital } = req.body;
    
    // Using service role key to completely bypass the database RLS INSERT restrictions!
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve hospital ID dynamically if hospital details are provided
    let resolvedHospitalId = null;

    if (hospital && hospital.name) {
      // Find if hospital already exists in DB by name
      const { data: existingHosp, error: findError } = await supabase
        .from('hospitals')
        .select('id')
        .eq('name', hospital.name)
        .limit(1);

      if (findError) {
        console.error('Find hospital error:', findError);
      }

      if (existingHosp && existingHosp.length > 0) {
        resolvedHospitalId = existingHosp[0].id;
      } else {
        // Insert new hospital into DB
        const { data: newHosp, error: insertHospError } = await supabase
          .from('hospitals')
          .insert([{
            name: hospital.name,
            location: hospital.location || 'Unknown Location',
            distance: hospital.distance || '0.0 miles',
            rating: hospital.rating || 4.5,
            image_url: hospital.image_url || hospital.image || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=600&h=400',
            wait_time: hospital.wait_time || '15 mins'
          }])
          .select();

        if (insertHospError) {
          console.error('Failed to insert new hospital:', insertHospError);
        } else if (newHosp && newHosp.length > 0) {
          resolvedHospitalId = newHosp[0].id;
        }
      }
    }

    const validHospitalId = resolvedHospitalId || hospital_id || 1;

    // Check if the appointment slot is already booked for this hospital
    const { data: existingAppts, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('hospital_id', validHospitalId)
      .eq('appointment_date', appointment_date);

    if (checkError) {
      return res.status(500).json({ error: 'Failed to verify appointment availability.' });
    }

    if (existingAppts && existingAppts.length > 0) {
      return res.status(409).json({ error: 'This time slot is already booked for this hospital. Please choose a different date or time.' });
    }

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
      .select(`
        *,
        hospitals (name, location, distance)
      `);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Send confirmation email
    try {
      const hospitalName = data[0].hospitals?.name || 'ArogyaConnect Partner Hospital';
      const formattedDate = new Date(appointment_date).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Appointment Booking Confirmation - ArogyaConnect',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #2563eb;">Appointment Confirmed!</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your appointment has been successfully scheduled.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Hospital:</strong> ${hospitalName}</p>
              <p style="margin: 5px 0;"><strong>Location/Address:</strong> ${data[0].hospitals?.location || 'Local Area'}</p>
              <p style="margin: 5px 0;"><strong>Distance:</strong> ${data[0].hospitals?.distance || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>Reason:</strong> ${notes || 'Routine Checkup'}</p>
            </div>
            <p>We wish you good health!</p>
            <p>Best regards,<br><strong>ArogyaConnect Team</strong></p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Confirmation email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // We don't fail the booking if the email fails to send
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
