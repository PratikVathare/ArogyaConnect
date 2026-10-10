const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/supabaseClient');
const transporter = require('../config/mailer');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Success
    return res.status(201).json({
      message: 'User registered successfully',
      user: authData.user,
      session: authData.session
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Success
    return res.status(200).json({
      message: 'Login successful',
      user: authData.user,
      session: authData.session
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/reset-password`;

    // Generate recovery link using Supabase Admin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError) {
      console.error('Generate recovery link error:', linkError);
      return res.status(400).json({ 
        error: linkError.message || 'Unable to generate password reset link. Please verify your email address.' 
      });
    }

    const actionLink = linkData?.properties?.action_link;
    const otpCode = linkData?.properties?.email_otp;

    // Send password reset email with Nodemailer
    const mailOptions = {
      from: `"ArogyaConnect Healthcare" <${process.env.EMAIL_USER}>`,
      to: cleanEmail,
      subject: 'Reset Your ArogyaConnect Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password - ArogyaConnect</title>
        </head>
        <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 36px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">ArogyaConnect</h1>
              <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px; font-weight: 500;">Healthcare & Hospital Management Portal</p>
            </div>
            
            <div style="padding: 36px 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #eff6ff; color: #2563eb; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Password Reset Request
                </span>
              </div>

              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px; text-align: center;">Need to reset your password?</h2>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                Hello,
              </p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                We received a request to reset your password for your ArogyaConnect account associated with <strong style="color: #1e293b;">${cleanEmail}</strong>. Click the button below to choose a new password:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${actionLink}" style="background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 16px; padding: 16px 36px; border-radius: 12px; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); transition: background-color 0.2s;">
                  Reset My Password
                </a>
              </div>

              ${otpCode ? `
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Or use this Security Code:
                </p>
                <div style="font-size: 26px; font-weight: 800; letter-spacing: 6px; color: #1e293b; font-family: monospace;">
                  ${otpCode}
                </div>
              </div>
              ` : ''}

              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
                  If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 12px; word-break: break-all; background-color: #f1f5f9; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <a href="${actionLink}" style="color: #2563eb; text-decoration: underline;">${actionLink}</a>
                </p>
              </div>

              <div style="margin-top: 24px; padding: 14px 16px; background-color: #fffbeb; border-radius: 10px; border: 1px solid #fef3c7;">
                <p style="color: #92400e; font-size: 12px; line-height: 1.5; margin: 0;">
                  <strong>Note:</strong> This link is single-use and will expire in 1 hour. If you did not request a password change, you can safely disregard this email.
                </p>
              </div>
            </div>

            <div style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} ArogyaConnect Health Services. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset link sent to: ${cleanEmail}`);

    return res.status(200).json({
      message: 'Password reset link sent successfully! Please check your email inbox.'
    });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.status(500).json({ error: 'Failed to send password reset email. Please try again.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, email, otp, accessToken } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.split(' ')[1]
      : accessToken;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Token-based update (from email action link redirect)
    if (token) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return res.status(401).json({ error: 'Password reset link is invalid or has expired. Please request a new one.' });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: password
      });

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      return res.status(200).json({ message: 'Password updated successfully! You can now log in.' });
    }

    // 2. OTP-based update (from security code)
    if (email && otp) {
      const cleanEmail = email.trim().toLowerCase();
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otp.trim(),
        type: 'recovery'
      });

      if (verifyError || !verifyData?.user) {
        return res.status(400).json({ error: verifyError?.message || 'Invalid or expired verification code.' });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(verifyData.user.id, {
        password: password
      });

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      return res.status(200).json({ message: 'Password updated successfully! You can now log in.' });
    }

    return res.status(400).json({ error: 'Missing recovery token or verification code.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({ error: 'Internal server error while resetting password.' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
