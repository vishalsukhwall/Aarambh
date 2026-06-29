const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Lead = require('../models/Lead');

// @route   POST api/quote
// @desc    Receive quote form data, save lead to DB, and email details to vishal.kvanta@gmail.com
// @access  Public
router.post('/', async (req, res) => {
  console.log('[API/QUOTE] Received incoming quote request at', new Date().toISOString());
  console.log('[API/QUOTE] Request Body:', JSON.stringify(req.body, null, 2));

  const {
    name,
    phone,
    email,
    cityState,
    startupName,
    businessStage,
    corporateStructure,
    servicesRequired,
    timeline,
    notes
  } = req.body;

  // 1. Basic Validation
  if (!name || !phone || !email) {
    console.warn('[API/QUOTE] Validation failed: Missing name, phone, or email.');
    return res.status(400).json({ success: false, msg: 'Name, Phone, and Email are required fields.' });
  }

  const formattedServices = Array.isArray(servicesRequired) 
    ? servicesRequired.join(', ') 
    : servicesRequired || 'Not Specified';

  // 2. Attempt Database Save
  let savedLead;
  try {
    console.log('[API/QUOTE] Attempting to save lead in database...');
    const newLead = new Lead({
      name,
      phone,
      email,
      service: formattedServices,
      message: `Stage: ${businessStage} | Structure: ${corporateStructure} | Timeline: ${timeline} | City: ${cityState || 'N/A'} | Notes: ${notes || 'None'}`,
      type: 'detailedQuote'
    });
    savedLead = await newLead.save();
    console.log('[API/QUOTE] Lead successfully saved in DB with ID:', savedLead._id);
  } catch (dbErr) {
    console.error('[API/QUOTE] Database Save Error:', dbErr);
    return res.status(500).json({ 
      success: false, 
      msg: `Database Error: Failed to save lead details. Details: ${dbErr.message}` 
    });
  }

  // 3. Attempt Email Delivery
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    console.log('[API/QUOTE] Checking SMTP environment variables...');
    console.log('[API/QUOTE] EMAIL_USER configured:', emailUser ? 'Yes' : 'No');
    console.log('[API/QUOTE] EMAIL_PASS configured:', emailPass ? 'Yes' : 'No');

    if (!emailUser || !emailPass) {
      throw new Error('SMTP credentials (EMAIL_USER or EMAIL_PASS) are missing in the server configuration.');
    }

    // Configure SMTP Transporter — Port 587 (STARTTLS) for Render compatibility
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // false = STARTTLS; port 465 (SSL) is blocked on most cloud hosts
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false, // bypass self-signed cert rejection on cloud servers
        minVersion: 'TLSv1.2'
      }
    });

    const textContent = `
==================================================
NEW ONBOARDING & CORPORATE QUOTE REQUEST
==================================================
1. Contact Person Name : ${name}
2. Mobile Number       : ${phone} (WhatsApp preferred)
3. Email ID            : ${email}
4. City & State        : ${cityState || 'Not Specified'}
5. Proposed Startup    : ${startupName || 'Not Specified'}
6. Business Stage      : ${businessStage}
7. Corporate Structure : ${corporateStructure}
8. Services Required   : ${formattedServices}
9. Launch Timeline     : ${timeline}
10. Notes / Pain Points:
${notes || 'None provided'}
==================================================
    `.trim();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 0;">New Onboarding & Quote Request</h2>
        <p style="color: #475569; font-size: 14px;">A new user has submitted a corporate quote questionnaire on the Aarambhh Onboarding Portal.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 40%;">Contact Person</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Mobile Number</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${phone} (WhatsApp preferred)</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Email ID</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">City & State</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${cityState || 'Not Specified'}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Proposed Startup</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${startupName || 'Not Specified'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Business Stage</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${businessStage}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Desired Structure</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${corporateStructure}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Services Required</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${formattedServices}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Timeline</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${timeline}</td>
          </tr>
        </table>

        <h3 style="color: #0f172a; margin-top: 20px; font-size: 16px;">Specific Notes & Pain Points</h3>
        <div style="background-color: #f1f5f9; border-left: 4px solid #10b981; padding: 12px; border-radius: 6px; font-size: 14px; color: #334155; font-style: italic;">
          ${notes ? notes.replace(/\n/g, '<br>') : 'No extra notes provided.'}
        </div>

        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
          This email was automatically generated and sent from the Aarambhh Backend Server.
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Aarambhh Onboarding" <${emailUser}>`,
      to: 'vishal.kvanta@gmail.com',
      replyTo: email,
      subject: `New Corporate Quote Request - ${startupName || name}`,
      text: textContent,
      html: htmlContent
    };

    // Verify SMTP connection config before sending
    console.log('[API/QUOTE] Verifying SMTP transporter connection...');
    await transporter.verify();
    console.log('[API/QUOTE] SMTP transporter connection verified successfully.');

    // Send Mail
    console.log('[API/QUOTE] Sending email to vishal.kvanta@gmail.com...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[API/QUOTE] Email sent successfully. Message ID:', info.messageId);

    res.json({ 
      success: true, 
      msg: 'Quote request submitted and email sent successfully!',
      leadId: savedLead._id
    });
  } catch (emailErr) {
    console.error('[API/QUOTE] Detailed Email Delivery Error:', emailErr);
    res.json({ 
      success: true, 
      msg: 'Quote request submitted successfully! (Note: DB Lead saved; admin email dispatch logged).',
      leadId: savedLead._id,
      emailSent: false,
      emailError: emailErr.message
    });
  }
});

module.exports = router;
