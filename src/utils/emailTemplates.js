export const emailTemplates = {
  contactNotification: (contactData) => {
    const escapeHtml = (text) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const formatMessage = (message) => {
      if (!message) return 'No message provided';
      return escapeHtml(message).replace(/\n/g, '<br>');
    };

    const currentDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return {
      subject: `New Contact Form Submission - ${contactData.name || 'Unknown User'}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear(135deg, #2d5e2d 0%, #3a7c3a 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .alert-badge { background: #e8f5e8; color: #2d5e2d; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #2d5e2d; }
        .contact-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-item { display: flex; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef; }
        .info-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .info-label { font-weight: 600; color: #495057; min-width: 120px; }
        .info-value { color: #212529; flex: 1; }
        .message-section { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 24px 0; }
        .message-label { font-weight: 600; color: #856404; margin-bottom: 8px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
        .action-buttons { margin-top: 24px; text-align: center; }
        .btn { display: inline-block; padding: 10px 20px; margin: 0 8px; background: #2d5e2d; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; }
        .btn-outline { background: transparent; border: 1px solid #2d5e2d; color: #2d5e2d; }
        @media (max-width: 600px) {
            .container { border-radius: 0; }
            .content { padding: 20px; }
            .info-item { flex-direction: column; }
            .info-label { margin-bottom: 4px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📩 New Contact Form Submission</h1>
            <p>Hanger Garments Website</p>
        </div>
        
        <div class="content">
            <div class="alert-badge">
                <strong>Action Required:</strong> A new contact form submission has been received and requires your attention.
            </div>
            
            <div class="contact-info">
                <h3 style="color: #2d5e2d; margin-bottom: 16px;">👤 Contact Details</h3>
                
                <div class="info-item">
                    <span class="info-label">Full Name:</span>
                    <span class="info-value">${escapeHtml(contactData.name) || 'Not provided'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Email Address:</span>
                    <span class="info-value">
                        <a href="mailto:${contactData.email}" style="color: #2d5e2d; text-decoration: none;">
                            ${contactData.email}
                        </a>
                    </span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Phone Number:</span>
                    <span class="info-value">${contactData.phone ? escapeHtml(contactData.phone) : 'Not provided'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Submission Time:</span>
                    <span class="info-value">${currentDate}</span>
                </div>
            </div>
            
            <div class="message-section">
                <div class="message-label">📝 Message Content:</div>
                <div style="color: #856404; line-height: 1.5;">
                    ${formatMessage(contactData.message)}
                </div>
            </div>
            
            <div class="action-buttons">
                <a href="mailto:${contactData.email}" class="btn">✉️ Reply to ${contactData.name?.split(' ')[0] || 'Customer'}</a>
                <a href="tel:${contactData.phone}" class="btn btn-outline" style="${!contactData.phone ? 'display: none;' : ''}">📞 Call Customer</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from Hanger Garments Contact System</p>
            <p style="margin-top: 8px;">Please do not reply to this email. Use the reply button above to respond to the customer.</p>
        </div>
    </div>
</body>
</html>
      `,
      text: `
NEW CONTACT FORM SUBMISSION - Hanger Garments

A new contact form submission has been received:

CONTACT DETAILS:
---------------
Name: ${contactData.name || 'Not provided'}
Email: ${contactData.email}
Phone: ${contactData.phone || 'Not provided'}
Time: ${currentDate}

MESSAGE:
--------
${contactData.message || 'No message provided'}

Please respond to this inquiry promptly.

This is an automated notification from Hanger Garments.
      `.trim()
    };
  },

  contactAutoReply: (contactData) => ({
    subject: 'Thank You for Contacting Hanger Garments',
    html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; color: #2d5e2d; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Contacting Us!</h1>
        </div>
        <div class="content">
            <p>Dear ${contactData.name || 'Valued Customer'},</p>
            <p>Thank you for reaching out to Hanger Garments. We have received your message and our team will get back to you within 24-48 hours.</p>
            <p>For urgent inquiries, please call us at [Your Phone Number].</p>
            <p>Best regards,<br>Hanger Garments Team</p>
        </div>
    </div>
</body>
</html>
    `,
    text: `
Thank you for contacting Hanger Garments!

Dear ${contactData.name || 'Valued Customer'},

Thank you for reaching out to us. We have received your message and our team will get back to you within 24-48 hours.

For urgent inquiries, please call us at [Your Phone Number].

Best regards,
Hanger Garments Team
    `.trim()
  }),

    welcomeEmail: (userData) => {
    const currentYear = new Date().getFullYear();
    const domain = process.env.DOMAIN_NAME || 'hangergarments.com';
    const frontendUrl = process.env.FRONTEND_URL || `https://${domain}`;
    
    return {
        // ✅ Fixed subject line - remove excessive emojis
        subject: `Welcome to Hanger Garments - Get Started with Organic Living`,
        
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Hanger Garments</title>
        <style>
            /* Reset and basic styles */
            body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f6f6f6; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: #2d5e2d; padding: 30px 20px; text-align: center; color: #ffffff; }
            .header h1 { font-size: 24px; margin: 0 0 10px 0; font-weight: bold; }
            .content { padding: 30px; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
            
            /* Content styles */
            .welcome-text { margin-bottom: 25px; }
            .features { margin: 25px 0; }
            .feature-item { margin-bottom: 15px; padding-left: 20px; }
            .cta-button { display: inline-block; padding: 12px 25px; background: #2d5e2d; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .account-info { background: #f8f8f8; padding: 15px; margin: 20px 0; border-left: 4px solid #2d5e2d; }
            
            /* Mobile responsive */
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .content { padding: 20px !important; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>Welcome to Hanger Garments</h1>
                <p>Your Journey to Healthier Living Begins</p>
            </div>
            
            <!-- Content -->
            <div class="content">
                <div class="welcome-text">
                    <p>Hello <strong>${userData.name}</strong>,</p>
                    <p>Thank you for joining Hanger Garments! We're excited to have you as part of our community dedicated to healthy, organic living.</p>
                </div>
                
                <div class="features">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">What You Can Expect:</h3>
                    <div class="feature-item">
                        <strong>Fresh Organic Produce:</strong> 100% certified organic fruits and vegetables
                    </div>
                    <div class="feature-item">
                        <strong>Fast Delivery:</strong> Fresh products delivered to your doorstep
                    </div>
                    <div class="feature-item">
                        <strong>Quality Guarantee:</strong> Competitive prices for premium quality products
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <a href="${frontendUrl}/products" class="cta-button">
                        Browse Our Products
                    </a>
                </div>
                
                <div class="account-info">
                    <h4 style="margin: 0 0 10px 0; color: #2d5e2d;">Your Account Information:</h4>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${userData.name}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${userData.email}</p>
                    <p style="margin: 5px 0;"><strong>Join Date:</strong> ${userData.joinDate}</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #856404;"><strong>Tip:</strong> Complete your profile to get personalized recommendations and faster checkout.</p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p><strong>Hanger Garments</strong></p>
                <p>Nourishing Lives Naturally</p>
                <p>Email: support@${domain} | Phone: +91 98765 43210</p>
                <p>
                    <a href="${frontendUrl}/preferences" style="color: #666666; text-decoration: none;">Update Preferences</a> | 
                    <a href="${frontendUrl}/unsubscribe" style="color: #666666; text-decoration: none;">Unsubscribe</a>
                </p>
                <p style="margin-top: 15px; font-size: 11px; color: #999999;">
                    &copy; ${currentYear} Hanger Garments. All rights reserved.<br>
                    This email was sent to ${userData.email} because you registered on our website.
                </p>
            </div>
        </div>
    </body>
    </html>
        `,
        
        // ✅ Proper text version is crucial for spam filters
        text: `
    Welcome to Hanger Garments

    Hello ${userData.name},

    Thank you for joining Hanger Garments! We're excited to have you as part of our community dedicated to healthy, organic living.

    WHAT YOU CAN EXPECT:
    • Fresh Organic Produce: 100% certified organic fruits and vegetables
    • Fast Delivery: Fresh products delivered to your doorstep
    • Quality Guarantee: Competitive prices for premium quality products

    GET STARTED:
    ${frontendUrl}/products

    YOUR ACCOUNT INFORMATION:
    Name: ${userData.name}
    Email: ${userData.email}
    Join Date: ${userData.joinDate}

    TIP: Complete your profile to get personalized recommendations and faster checkout.

    Need help? Contact us:
    Email: support@${domain}
    Phone: +91 98765 43210

    Update your preferences: ${frontendUrl}/preferences
    Unsubscribe: ${frontendUrl}/unsubscribe

    Hanger Garments
    Nourishing Lives Naturally

    © ${currentYear} Hanger Garments. All rights reserved.
    This email was sent to ${userData.email} because you registered on our website.
        `.trim()
    };
    },

   passwordReset: (userData, resetUrl) => {
    const domain = process.env.DOMAIN_NAME || 'hangergarments.com';
    const supportEmail = process.env.SUPPORT_EMAIL || `support@${domain}`;
    const expiryTime = '1 hour';
    
    return {
      subject: 'Reset Your Password - Hanger Garments',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Hanger Garments</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear(135deg, #dc3545 0%, #c82333 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        .content { padding: 30px; }
        .alert-badge { background: #ffe6e6; color: #dc3545; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #dc3545; }
        .reset-section { text-align: center; margin: 30px 0; }
        .reset-button { display: inline-block; padding: 14px 32px; background: #dc3545; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 20px 0; }
        .info-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
        .security-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; color: #856404; }
        @media (max-width: 600px) {
            .container { border-radius: 0; }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Password Reset Request</h1>
            <p>Hanger Garments Account Security</p>
        </div>
        
        <div class="content">
            <div class="alert-badge">
                <strong>Security Notice:</strong> A password reset was requested for your account.
            </div>
            
            <p>Hello <strong>${userData.name}</strong>,</p>
            
            <p>We received a request to reset your password for your Hanger Garments account. If you didn't make this request, please ignore this email.</p>
            
            <div class="reset-section">
                <p>To reset your password, click the button below:</p>
                <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
                <p style="margin-top: 10px; font-size: 14px; color: #666;">
                    Or copy and paste this link in your browser:<br>
                    <span style="word-break: break-all; color: #dc3545;">${resetUrl}</span>
                </p>
            </div>
            
            <div class="security-note">
                <strong>⚠️ Important Security Information:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    <li>This link will expire in <strong>${expiryTime}</strong></li>
                    <li>Do not share this link with anyone</li>
                    <li>Our team will never ask for your password</li>
                </ul>
            </div>
            
            <div class="info-box">
                <h3 style="color: #495057; margin-bottom: 10px;">Need Help?</h3>
                <p style="margin: 5px 0;">If you're having trouble resetting your password, contact our support team:</p>
                <p style="margin: 5px 0;">
                    <strong>Email:</strong> 
                    <a href="mailto:${supportEmail}" style="color: #dc3545; text-decoration: none;">${supportEmail}</a>
                </p>
                <p style="margin: 5px 0;"><strong>Response Time:</strong> Within 24 hours</p>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated security email from Hanger Garments</p>
            <p style="margin-top: 8px;">
                <strong>Hanger Garments</strong><br>
                Nourishing Lives Naturally
            </p>
        </div>
    </div>
</body>
</html>
      `,
      text: `
PASSWORD RESET REQUEST - Hanger Garments

Hello ${userData.name},

We received a request to reset your password for your Hanger Garments account.

To reset your password, visit this link:
${resetUrl}

IMPORTANT SECURITY INFORMATION:
- This link will expire in 1 hour
- Do not share this link with anyone
- Our team will never ask for your password

If you didn't request this reset, please ignore this email. Your account remains secure.

Need help? Contact our support team: ${supportEmail}

This is an automated security email from Hanger Garments.

Hanger Garments
Nourishing Lives Naturally
      `.trim()
    };
  },

  passwordChangedConfirmation: (userData) => {
    const domain = process.env.DOMAIN_NAME || 'hangergarments.com';
    const supportEmail = process.env.SUPPORT_EMAIL || `support@${domain}`;
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    return {
      subject: 'Password Changed Successfully - Hanger Garments',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed - Hanger Garments</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear(135deg, #28a745 0%, #20c997 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        .content { padding: 30px; }
        .success-badge { background: #d4edda; color: #155724; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #28a745; }
        .security-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
        @media (max-width: 600px) {
            .container { border-radius: 0; }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Password Changed Successfully</h1>
            <p>Hanger Garments Account Security</p>
        </div>
        
        <div class="content">
            <div class="success-badge">
                <strong>Success:</strong> Your password has been updated successfully.
            </div>
            
            <p>Hello <strong>${userData.name}</strong>,</p>
            
            <p>This email confirms that your Hanger Garments account password was changed on <strong>${timestamp}</strong>.</p>
            
            <div class="security-info">
                <h3 style="color: #495057; margin-bottom: 15px;">🔒 Security Information</h3>
                <ul style="margin-left: 20px;">
                    <li>Your new password is now active</li>
                    <li>You'll need to use this new password for future logins</li>
                    <li>All your existing sessions remain active</li>
                </ul>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                    <strong>Didn't make this change?</strong><br>
                    If you didn't change your password, please contact our support team immediately at 
                    <a href="mailto:${supportEmail}" style="color: #856404; text-decoration: underline;">${supportEmail}</a>
                </p>
            </div>
            
            <p>Thank you for helping us keep your account secure.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated security notification from Hanger Garments</p>
            <p style="margin-top: 8px;">
                <strong>Hanger Garments</strong><br>
                Nourishing Lives Naturally
            </p>
        </div>
    </div>
</body>
</html>
      `,
      text: `
PASSWORD CHANGED SUCCESSFULLY - Hanger Garments

Hello ${userData.name},

This email confirms that your Hanger Garments account password was changed on ${timestamp}.

SECURITY INFORMATION:
- Your new password is now active
- You'll need to use this new password for future logins
- All your existing sessions remain active

Didn't make this change?
If you didn't change your password, please contact our support team immediately at ${supportEmail}

Thank you for helping us keep your account secure.

This is an automated security notification from Hanger Garments.

Hanger Garments
Nourishing Lives Naturally
      `.trim()
    };
  },

   orderConfirmationCustomer: (orderData) => {
    const domain = process.env.DOMAIN_NAME || 'hangergarments.com';
    const supportEmail = process.env.SUPPORT_EMAIL || `support@${domain}`;
    const orderDate = new Date(orderData.createdAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      subject: `Order Confirmed - #${orderData.orderNumber} - Hanger Garments`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Hanger Garments</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear(135deg, #2d5e2d 0%, #3a7c3a 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        .content { padding: 30px; }
        .success-badge { background: #d4edda; color: #155724; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #28a745; }
        .order-summary { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .order-items { margin: 20px 0; }
        .order-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
        .order-item:last-child { border-bottom: none; }
        .item-details { flex: 2; }
        .item-price { flex: 1; text-align: right; }
        .amount-breakdown { background: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .breakdown-total { border-top: 2px solid #2d5e2d; font-weight: bold; font-size: 18px; }
        .shipping-info, .payment-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
        .status-badge { display: inline-block; padding: 4px 12px; background: #28a745; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; }
        @media (max-width: 600px) {
            .container { border-radius: 0; }
            .content { padding: 20px; }
            .order-item { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Order Confirmed!</h1>
            <p>Thank you for your purchase</p>
        </div>
        
        <div class="content">
            <div class="success-badge">
                <strong>Order Confirmed:</strong> Your order #${orderData.orderNumber} has been successfully placed.
            </div>
            
            <p>Hello <strong>${orderData.name}</strong>,</p>
            <p>Thank you for choosing Hanger Garments! We're preparing your order and will notify you once it's shipped.</p>
            
            <div class="order-summary">
                <h3 style="color: #2d5e2d; margin-bottom: 15px;">📦 Order Summary</h3>
                <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Status:</strong> <span class="status-badge">${orderData.status}</span></p>
            </div>

            <div class="order-items">
                <h3 style="color: #2d5e2d; margin-bottom: 15px;">🛒 Order Items</h3>
                ${orderData.orderItems.map(item => `
                <div class="order-item">
                    <div class="item-details">
                        <strong>${item.product.name}</strong>
                        <br>
                        <small>Quantity: ${item.quantity} × ₹${item.price}</small>
                    </div>
                    <div class="item-price">
                        ₹${(item.quantity * item.price).toFixed(2)}
                    </div>
                </div>
                `).join('')}
            </div>

            <div class="amount-breakdown">
                <h3 style="color: #2d5e2d; margin-bottom: 15px;">💰 Amount Breakdown</h3>
                <div class="breakdown-row">
                    <span>Subtotal:</span>
                    <span>₹${orderData.subtotal.toFixed(2)}</span>
                </div>
                ${orderData.discount > 0 ? `
                <div class="breakdown-row" style="color: #28a745;">
                    <span>Discount:</span>
                    <span>-₹${orderData.discount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="breakdown-row">
                    <span>Shipping:</span>
                    <span>₹${orderData.shippingCost.toFixed(2)}</span>
                </div>
                <div class="breakdown-row breakdown-total">
                    <span>Total Amount:</span>
                    <span>₹${orderData.totalAmount.toFixed(2)}</span>
                </div>
            </div>

            <div class="shipping-info">
                <h3 style="color: #2d5e2d; margin-bottom: 15px;">🏠 Shipping Address</h3>
                <p>${orderData.name}<br>
                ${orderData.address}<br>
                ${orderData.city}, ${orderData.state} - ${orderData.pincode}<br>
                📞 ${orderData.phone}<br>
                ✉️ ${orderData.email}</p>
            </div>

            <div class="payment-info">
                <h3 style="color: #2d5e2d; margin-bottom: 15px;">💳 Payment Information</h3>
                <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
                <p><strong>Payment Status:</strong> <span class="status-badge">${orderData.paymentStatus}</span></p>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1565c0; margin-bottom: 10px;">📞 Need Help?</h4>
                <p style="margin: 0;">If you have any questions about your order, contact our support team:</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${supportEmail}" style="color: #1565c0;">${supportEmail}</a></p>
                <p style="margin: 0;"><strong>Phone:</strong> +91 98765 43210</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Hanger Garments</strong></p>
            <p>Nourishing Lives Naturally</p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">
                This is an automated order confirmation email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
      `,
      text: `
ORDER CONFIRMED - Hanger Garments

Hello ${orderData.name},

Thank you for your order! We're excited to let you know that we've received your order #${orderData.orderNumber} and it is now being processed.

ORDER SUMMARY:
--------------
Order Number: ${orderData.orderNumber}
Order Date: ${orderDate}
Status: ${orderData.status}

ORDER ITEMS:
------------
${orderData.orderItems.map(item => 
  `• ${item.product.name} - ${item.quantity} × ₹${item.price} = ₹${(item.quantity * item.price).toFixed(2)}`
).join('\n')}

AMOUNT BREAKDOWN:
-----------------
Subtotal: ₹${orderData.subtotal.toFixed(2)}
${orderData.discount > 0 ? `Discount: -₹${orderData.discount.toFixed(2)}\n` : ''}Shipping: ₹${orderData.shippingCost.toFixed(2)}
Total: ₹${orderData.totalAmount.toFixed(2)}

SHIPPING ADDRESS:
-----------------
${orderData.name}
${orderData.address}
${orderData.city}, ${orderData.state} - ${orderData.pincode}
Phone: ${orderData.phone}
Email: ${orderData.email}

PAYMENT INFORMATION:
-------------------
Payment Method: ${orderData.paymentMethod}
Payment Status: ${orderData.paymentStatus}

Need help? Contact our support team:
Email: ${supportEmail}
Phone: +91 98765 43210


Thank you for choosing Hanger Garments!

--
Hanger Garments
Nourishing Lives Naturally
      `.trim()
    };
  },

    orderConfirmationAdmin: (orderData) => {
    const orderDate = new Date(orderData.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const domain = process.env.DOMAIN_NAME || 'shrivelanorganicfoods.com';
    const adminUrl = process.env.ADMIN_URL || `https://admin.${domain}`;

    return {
        // ✅ Fixed subject - removed emoji and excessive symbols
        subject: `New Order Notification - Order ${orderData.orderNumber} - ${orderData.totalAmount.toFixed(2)} INR`,
        
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification - Hanger Garments</title>
        <style>
            /* Reset and basic styles */
            body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f6f6f6; }
            .container { max-width: 700px; margin: 0 auto; background: #ffffff; }
            .header { background: #2d5e2d; padding: 25px 20px; text-align: center; color: #ffffff; }
            .header h1 { font-size: 22px; margin: 0 0 10px 0; font-weight: bold; }
            .content { padding: 25px; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
            
            /* Content styles */
            .alert-section { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
            .order-overview { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 15px; }
            .overview-item { background: white; padding: 12px; border-radius: 4px; border-left: 4px solid #2d5e2d; }
            .order-items { margin: 20px 0; }
            .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
            .amount-summary { background: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .summary-total { border-top: 2px solid #2d5e2d; font-weight: bold; font-size: 16px; }
            .customer-info { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .action-buttons { margin-top: 25px; text-align: center; }
            .btn { display: inline-block; padding: 10px 20px; margin: 0 8px; background: #2d5e2d; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; }
            
            /* Mobile responsive */
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .content { padding: 20px !important; }
                .overview-grid { grid-template-columns: 1fr; }
                .btn { display: block; margin: 10px 0; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>New Order Received</h1>
                <p>Order ${orderData.orderNumber} - Requires Processing</p>
            </div>
            
            <!-- Content -->
            <div class="content">
                <div class="alert-section">
                    <strong>New Order Alert:</strong> A new order has been placed and requires processing.
                </div>

                <div class="order-overview">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">Order Overview</h3>
                    <div class="overview-grid">
                        <div class="overview-item">
                            <strong>Order Number</strong><br>
                            ${orderData.orderNumber}
                        </div>
                        <div class="overview-item">
                            <strong>Order Date</strong><br>
                            ${orderDate}
                        </div>
                        <div class="overview-item">
                            <strong>Total Amount</strong><br>
                            ₹${orderData.totalAmount.toFixed(2)}
                        </div>
                        <div class="overview-item">
                            <strong>Payment Method</strong><br>
                            ${orderData.paymentMethod}
                        </div>
                    </div>
                </div>

                <div class="customer-info">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">Customer Information</h3>
                    <p><strong>Name:</strong> ${orderData.name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${orderData.email}">${orderData.email}</a></p>
                    <p><strong>Phone:</strong> <a href="tel:${orderData.phone}">${orderData.phone}</a></p>
                    <p><strong>Address:</strong> ${orderData.address}, ${orderData.city}, ${orderData.state} - ${orderData.pincode}</p>
                </div>

                <div class="order-items">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">Order Items</h3>
                    ${orderData.orderItems.map(item => `
                    <div class="order-item">
                        <div style="flex: 2;">
                            <strong>${item.product.name}</strong>
                            <br>
                            <small>Quantity: ${item.quantity} × ₹${item.price}</small>
                        </div>
                        <div style="flex: 1; text-align: right;">
                            ₹${(item.quantity * item.price).toFixed(2)}
                        </div>
                    </div>
                    `).join('')}
                </div>

                <div class="amount-summary">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">Order Summary</h3>
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>₹${orderData.subtotal.toFixed(2)}</span>
                    </div>
                    ${orderData.discount > 0 ? `
                    <div class="summary-row">
                        <span>Discount:</span>
                        <span style="color: #28a745;">-₹${orderData.discount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="summary-row">
                        <span>Shipping:</span>
                        <span>₹${orderData.shippingCost.toFixed(2)}</span>
                    </div>
                    <div class="summary-row summary-total">
                        <span>Grand Total:</span>
                        <span>₹${orderData.totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div class="action-buttons">
                    <a href="${adminUrl}/orders/${orderData.id}" class="btn">
                        View Order in Admin Panel
                    </a>
                    <a href="mailto:${orderData.email}?subject=Regarding Order ${orderData.orderNumber}" class="btn" style="background: #6c757d;">
                        Contact Customer
                    </a>
                </div>

                <div style="margin-top: 25px; padding: 15px; background: #e9ecef; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #495057;">Next Steps:</h4>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li>Review order details</li>
                        <li>Prepare items for shipping</li>
                        <li>Update order status when shipped</li>
                    </ol>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p><strong>Hanger Garments - Order Management System</strong></p>
                <p>This is an automated notification. Please process this order promptly.</p>
                <p style="margin-top: 10px; font-size: 11px; color: #999;">
                    If you believe you received this email in error, please contact system administration.
                </p>
            </div>
        </div>
    </body>
    </html>
        `,
        
        // ✅ Proper text version
        text: `
    NEW ORDER NOTIFICATION - Hanger Garments

    A new order has been placed and requires processing.

    ORDER OVERVIEW:
    ---------------
    Order Number: ${orderData.orderNumber}
    Order Date: ${orderDate}
    Total Amount: ₹${orderData.totalAmount.toFixed(2)}
    Payment Method: ${orderData.paymentMethod}
    Payment Status: ${orderData.paymentStatus}

    CUSTOMER INFORMATION:
    --------------------
    Name: ${orderData.name}
    Email: ${orderData.email}
    Phone: ${orderData.phone}
    Address: ${orderData.address}, ${orderData.city}, ${orderData.state} - ${orderData.pincode}

    ORDER ITEMS:
    -----------
    ${orderData.orderItems.map(item => 
    `• ${item.product.name}
    Quantity: ${item.quantity} × ₹${item.price} = ₹${(item.quantity * item.price).toFixed(2)}`
    ).join('\n')}

    ORDER SUMMARY:
    --------------
    Subtotal: ₹${orderData.subtotal.toFixed(2)}
    ${orderData.discount > 0 ? `Discount: -₹${orderData.discount.toFixed(2)}\n` : ''}Shipping: ₹${orderData.shippingCost.toFixed(2)}
    Grand Total: ₹${orderData.totalAmount.toFixed(2)}

    NEXT STEPS:
    -----------
    1. Review order details
    2. Prepare items for shipping
    3. Update order status when shipped

    View order in admin panel: ${adminUrl}/orders/${orderData.id}

    This is an automated order notification from Hanger Garments.

    --
    Hanger Garments
    Order Management System
        `.trim()
    };
    },
  

 wholesalerApprovalNotification: (wholesalerData) => {
    const escapeHtml = (text) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const currentDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return {
      subject: `New Wholesaler Application - ${wholesalerData.businessName || 'Unknown Business'}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Wholesaler Application</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
        .container { max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear(135deg, #2c5aa0 0%, #3a7bd5 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .alert-badge { background: #e3f2fd; color: #1565c0; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #1565c0; }
        .business-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-item { display: flex; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef; }
        .info-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .info-label { font-weight: 600; color: #495057; min-width: 150px; }
        .info-value { color: #212529; flex: 1; }
        .requirements-section { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 24px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
        .action-buttons { margin-top: 24px; text-align: center; }
        .btn { display: inline-block; padding: 10px 20px; margin: 0 8px; background: #2c5aa0; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; }
        .btn-outline { background: transparent; border: 1px solid #2c5aa0; color: #2c5aa0; }
        @media (max-width: 600px) {
            .container { border-radius: 0; }
            .content { padding: 20px; }
            .info-item { flex-direction: column; }
            .info-label { margin-bottom: 4px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 New Wholesaler Application</h1>
            <p>Hanger Garments Wholesaler Program</p>
        </div>
        
        <div class="content">
            <div class="alert-badge">
                <strong>Action Required:</strong> A new wholesaler application has been submitted and requires review.
            </div>
            
            <div class="business-info">
                <h3 style="color: #2c5aa0; margin-bottom: 16px;">🏢 Business Details</h3>
                
                <div class="info-item">
                    <span class="info-label">Business Name:</span>
                    <span class="info-value">${escapeHtml(wholesalerData.businessName) || 'Not provided'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Contact Person:</span>
                    <span class="info-value">${escapeHtml(wholesalerData.contactPerson) || 'Not provided'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Email Address:</span>
                    <span class="info-value">
                        <a href="mailto:${wholesalerData.email}" style="color: #2c5aa0; text-decoration: none;">
                            ${wholesalerData.email}
                        </a>
                    </span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Phone Number:</span>
                    <span class="info-value">${wholesalerData.phone ? escapeHtml(wholesalerData.phone) : 'Not provided'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Business Type:</span>
                    <span class="info-value">${wholesalerData.businessType || 'Not specified'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">GST Number:</span>
                    <span class="info-value">${wholesalerData.gstNumber ? escapeHtml(wholesalerData.gstNumber) : 'Not provided'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Business Address:</span>
                    <span class="info-value">${wholesalerData.address ? escapeHtml(wholesalerData.address) : 'Not provided'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Expected Order Volume:</span>
                    <span class="info-value">${wholesalerData.expectedVolume || 'Not specified'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Submission Time:</span>
                    <span class="info-value">${currentDate}</span>
                </div>
            </div>
            
            ${wholesalerData.additionalInfo ? `
            <div class="requirements-section">
                <div class="message-label">📝 Additional Information:</div>
                <div style="color: #856404; line-height: 1.5;">
                    ${escapeHtml(wholesalerData.additionalInfo).replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}
            
            <div class="requirements-section">
                <h4 style="color: #856404; margin-bottom: 10px;">📋 Next Steps Required:</h4>
                <ol style="color: #856404; margin-left: 20px;">
                    <li>Verify business credentials and GST information</li>
                    <li>Review expected order volume and requirements</li>
                    <li>Contact applicant for additional information if needed</li>
                    <li>Approve or reject the application in the admin panel</li>
                    <li>Send confirmation email to the applicant</li>
                </ol>
            </div>
            
            <div class="action-buttons">
                <a href="mailto:${wholesalerData.email}" class="btn">✉️ Contact ${wholesalerData.contactPerson?.split(' ')[0] || 'Applicant'}</a>
                <a href="tel:${wholesalerData.phone}" class="btn btn-outline" style="${!wholesalerData.phone ? 'display: none;' : ''}">📞 Call Business</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from Hanger Garments Wholesaler Management System</p>
            <p style="margin-top: 8px;">Please review this application within 48 hours.</p>
        </div>
    </div>
</body>
</html>
      `,
      text: `
NEW WHOLESALER APPLICATION - Hanger Garments

A new wholesaler application has been submitted and requires review.

BUSINESS DETAILS:
-----------------
Business Name: ${wholesalerData.businessName || 'Not provided'}
Contact Person: ${wholesalerData.contactPerson || 'Not provided'}
Email: ${wholesalerData.email}
Phone: ${wholesalerData.phone || 'Not provided'}
Business Type: ${wholesalerData.businessType || 'Not specified'}
GST Number: ${wholesalerData.gstNumber || 'Not provided'}
Business Address: ${wholesalerData.address || 'Not provided'}
Expected Order Volume: ${wholesalerData.expectedVolume || 'Not specified'}
Submission Time: ${currentDate}

${wholesalerData.additionalInfo ? `
ADDITIONAL INFORMATION:
-----------------------
${wholesalerData.additionalInfo}
` : ''}

NEXT STEPS REQUIRED:
-------------------
1. Verify business credentials and GST information
2. Review expected order volume and requirements
3. Contact applicant for additional information if needed
4. Approve or reject the application
5. Send confirmation email to the applicant

Please review this application within 48 hours.

This is an automated notification from Hanger Garments.
      `.trim()
    };
  },

  wholesalerAutoReply: (wholesalerData) => ({
    subject: 'Wholesaler Application Received - Hanger Garments',
    html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; color: #2c5aa0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
        .timeline { margin: 20px 0; }
        .timeline-item { margin-bottom: 15px; padding-left: 20px; border-left: 3px solid #2c5aa0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Wholesaler Application Received</h1>
        </div>
        <div class="content">
            <p>Dear ${wholesalerData.contactPerson || 'Valued Business Partner'},</p>
            
            <p>Thank you for your interest in becoming a wholesale partner with Hanger Garments!</p>
            
            <p>We have received your application and our team is currently reviewing it. Here's what you can expect next:</p>
            
            <div class="timeline">
                <div class="timeline-item">
                    <strong>Application Review</strong><br>
                    Our team will review your business details within 2-3 business days
                </div>
                <div class="timeline-item">
                    <strong>Verification Call</strong><br>
                    We may contact you for additional information or clarification
                </div>
                <div class="timeline-item">
                    <strong>Approval Decision</strong><br>
                    You will receive notification of our decision via email
                </div>
                <div class="timeline-item">
                    <strong>Onboarding</strong><br>
                    If approved, we'll guide you through the onboarding process
                </div>
            </div>
            
            <p><strong>Business Name:</strong> ${wholesalerData.businessName}</p>
            <p><strong>Application Date:</strong> ${new Date().toLocaleDateString()}</p>
            
            <p>If you have any questions, please don't hesitate to contact our wholesale team.</p>
            
            <p>Best regards,<br>
            <strong>Wholesale Partnership Team</strong><br>
            Hanger Garments</p>
        </div>
    </div>
</body>
</html>
    `,
    text: `
Wholesaler Application Received - Hanger Garments

Dear ${wholesalerData.contactPerson || 'Valued Business Partner'},

Thank you for your interest in becoming a wholesale partner with Hanger Garments!

We have received your application and our team is currently reviewing it. Here's what you can expect next:

APPLICATION PROCESS:
-------------------
• Application Review: Our team will review your business details within 2-3 business days
• Verification Call: We may contact you for additional information or clarification
• Approval Decision: You will receive notification of our decision via email
• Onboarding: If approved, we'll guide you through the onboarding process

APPLICATION DETAILS:
-------------------
Business Name: ${wholesalerData.businessName}
Application Date: ${new Date().toLocaleDateString()}

If you have any questions, please don't hesitate to contact our wholesale team.

Best regards,
Wholesale Partnership Team
Hanger Garments
    `.trim()
  }),

  wholesalerApprovalConfirmation: (wholesalerData) => ({
    subject: 'Wholesaler Application Approved - Welcome to Hanger Garments!',
    html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; color: #28a745; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
        .next-steps { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Our Wholesale Family!</h1>
        </div>
        <div class="content">
            <p>Dear ${wholesalerData.contactPerson},</p>
            
            <p>We are delighted to inform you that your wholesaler application for <strong>${wholesalerData.businessName}</strong> has been approved!</p>
            
            <div class="next-steps">
                <h3>Next Steps to Get Started:</h3>
                <ul>
                    <li>Access our wholesale portal using your registered email</li>
                    <li>Explore our complete product catalog with wholesale pricing</li>
                    <li>Review our minimum order quantities and shipping policies</li>
                    <li>Place your first order and experience our quality products</li>
                </ul>
            </div>
            
            <p><strong>Your Wholesale Account Details:</strong></p>
            <p>Business: ${wholesalerData.businessName}<br>
            Contact: ${wholesalerData.contactPerson}<br>
            Email: ${wholesalerData.email}<br>
            Account Type: Wholesale Partner</p>
            
            <p>Our wholesale team will contact you shortly to discuss your specific requirements and introduce you to your account manager.</p>
            
            <p>Welcome to the Hanger Garments family!</p>
            
            <p>Best regards,<br>
            <strong>Wholesale Partnership Team</strong><br>
            Hanger Garments</p>
        </div>
    </div>
</body>
</html>
    `,
    text: `
Wholesaler Application Approved - Welcome to Hanger Garments!

Dear ${wholesalerData.contactPerson},

We are delighted to inform you that your wholesaler application for ${wholesalerData.businessName} has been approved!

NEXT STEPS TO GET STARTED:
-------------------------
• Access our wholesale portal using your registered email
• Explore our complete product catalog with wholesale pricing
• Review our minimum order quantities and shipping policies
• Place your first order and experience our quality products

YOUR WHOLESALE ACCOUNT DETAILS:
------------------------------
Business: ${wholesalerData.businessName}
Contact: ${wholesalerData.contactPerson}
Email: ${wholesalerData.email}
Account Type: Wholesale Partner

Our wholesale team will contact you shortly to discuss your specific requirements and introduce you to your account manager.

Welcome to the Hanger Garments family!

Best regards,
Wholesale Partnership Team
Hanger Garments
    `.trim()
  }),


    // Add to your existing emailTemplates object
    contactNotification: (contactData) => {
    const escapeHtml = (text) => {
        if (!text) return '';
        return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const formatMessage = (message) => {
        if (!message) return 'No message provided';
        return escapeHtml(message).replace(/\n/g, '<br>');
    };

    const currentDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return {
        subject: `New Contact Form Submission - ${contactData.name || 'Unknown User'}`,
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear(135deg, #2d5e2d 0%, #3a7c3a 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
            .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
            .header p { font-size: 14px; opacity: 0.9; }
            .content { padding: 30px; }
            .alert-badge { background: #e8f5e8; color: #2d5e2d; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #2d5e2d; }
            .contact-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-item { display: flex; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef; }
            .info-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
            .info-label { font-weight: 600; color: #495057; min-width: 120px; }
            .info-value { color: #212529; flex: 1; }
            .message-section { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .message-label { font-weight: 600; color: #856404; margin-bottom: 8px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
            .action-buttons { margin-top: 24px; text-align: center; }
            .btn { display: inline-block; padding: 10px 20px; margin: 0 8px; background: #2d5e2d; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; }
            .btn-outline { background: transparent; border: 1px solid #2d5e2d; color: #2d5e2d; }
            @media (max-width: 600px) {
                .container { border-radius: 0; }
                .content { padding: 20px; }
                .info-item { flex-direction: column; }
                .info-label { margin-bottom: 4px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📩 New Contact Form Submission</h1>
                <p>Hanger Garments Website</p>
            </div>
            
            <div class="content">
                <div class="alert-badge">
                    <strong>Action Required:</strong> A new contact form submission has been received and requires your attention.
                </div>
                
                <div class="contact-info">
                    <h3 style="color: #2d5e2d; margin-bottom: 16px;">👤 Contact Details</h3>
                    
                    <div class="info-item">
                        <span class="info-label">Full Name:</span>
                        <span class="info-value">${escapeHtml(contactData.name) || 'Not provided'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Email Address:</span>
                        <span class="info-value">
                            <a href="mailto:${contactData.email}" style="color: #2d5e2d; text-decoration: none;">
                                ${contactData.email}
                            </a>
                        </span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Phone Number:</span>
                        <span class="info-value">${contactData.phone ? escapeHtml(contactData.phone) : 'Not provided'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">User Account:</span>
                        <span class="info-value">${contactData.userId ? 'Registered User' : 'Guest'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Submission Time:</span>
                        <span class="info-value">${currentDate}</span>
                    </div>
                </div>
                
                <div class="message-section">
                    <div class="message-label">📝 Message Content:</div>
                    <div style="color: #856404; line-height: 1.5;">
                        ${formatMessage(contactData.message)}
                    </div>
                </div>
                
                <div class="action-buttons">
                    <a href="mailto:${contactData.email}" class="btn">✉️ Reply to ${contactData.name?.split(' ')[0] || 'Customer'}</a>
                    <a href="tel:${contactData.phone}" class="btn btn-outline" style="${!contactData.phone ? 'display: none;' : ''}">📞 Call Customer</a>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated notification from Hanger Garments Contact System</p>
                <p style="margin-top: 8px;">Please do not reply to this email. Use the reply button above to respond to the customer.</p>
            </div>
        </div>
    </body>
    </html>
        `,
        text: `
    NEW CONTACT FORM SUBMISSION - Hanger Garments

    A new contact form submission has been received:

    CONTACT DETAILS:
    ---------------
    Name: ${contactData.name || 'Not provided'}
    Email: ${contactData.email}
    Phone: ${contactData.phone || 'Not provided'}
    User Type: ${contactData.userId ? 'Registered User' : 'Guest'}
    Time: ${currentDate}

    MESSAGE:
    --------
    ${contactData.message || 'No message provided'}

    Please respond to this inquiry promptly.

    This is an automated notification from Hanger Garments.
        `.trim()
    };
    },

    contactAutoReply: (contactData) => ({
    subject: 'Thank You for Contacting Hanger Garments',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; color: #2d5e2d; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .timeline { margin: 20px 0; }
            .timeline-item { margin-bottom: 15px; padding-left: 20px; border-left: 3px solid #2d5e2d; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Thank You for Contacting Us!</h1>
            </div>
            <div class="content">
                <p>Dear ${contactData.name || 'Valued Customer'},</p>
                
                <p>Thank you for reaching out to Hanger Garments. We have received your message and our team will get back to you within 24-48 hours.</p>
                
                <div class="timeline">
                    <div class="timeline-item">
                        <strong>Message Received</strong><br>
                        We've received your inquiry and it's in our queue
                    </div>
                    <div class="timeline-item">
                        <strong>Team Review</strong><br>
                        Our team will review your message and assign it to the right person
                    </div>
                    <div class="timeline-item">
                        <strong>Response</strong><br>
                        You'll receive a personalized response from our team
                    </div>
                </div>
                
                <p><strong>Your Inquiry Details:</strong></p>
                <p>Reference ID: ${contactData.id}<br>
                Submitted: ${new Date(contactData.createdAt).toLocaleDateString()}</p>
                
                <p>For urgent inquiries, please call us at +91 98765 43210.</p>
                
                <p>Best regards,<br>
                <strong>Customer Support Team</strong><br>
                Hanger Garments</p>
            </div>
        </div>
    </body>
    </html>
    `,
    text: `
    Thank You for Contacting Hanger Garments

    Dear ${contactData.name || 'Valued Customer'},

    Thank you for reaching out to Hanger Garments. We have received your message and our team will get back to you within 24-48 hours.

    WHAT TO EXPECT:
    --------------
    • Message Received: We've received your inquiry and it's in our queue
    • Team Review: Our team will review your message and assign it to the right person
    • Response: You'll receive a personalized response from our team

    YOUR INQUIRY DETAILS:
    --------------------
    Reference ID: ${contactData.id}
    Submitted: ${new Date(contactData.createdAt).toLocaleDateString()}

    For urgent inquiries, please call us at +91 98765 43210.

    Best regards,
    Customer Support Team
    Hanger Garments
    `.trim()
    }),


    // Add these order email templates to your existing emailTemplates object

    orderConfirmationCustomer: (orderData) => {
    const orderDate = new Date(orderData.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const domain = process.env.DOMAIN_NAME || 'hangergarments.com';
    const supportEmail = process.env.SUPPORT_EMAIL || `support@${domain}`;
    const trackingUrl = orderData.trackingUrl || '#';

    return {
        subject: `Order Confirmed - #${orderData.orderNumber} - Hanger Garments`,
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Hanger Garments</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear(135deg, #2d5e2d 0%, #3a7c3a 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
            .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
            .content { padding: 30px; }
            .success-badge { background: #d4edda; color: #155724; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #28a745; }
            .order-summary { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .order-items { margin: 20px 0; }
            .order-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
            .order-item:last-child { border-bottom: none; }
            .item-details { flex: 2; }
            .item-price { flex: 1; text-align: right; }
            .amount-breakdown { background: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .breakdown-total { border-top: 2px solid #2d5e2d; font-weight: bold; font-size: 18px; }
            .shipping-info, .payment-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
            .status-badge { display: inline-block; padding: 4px 12px; background: #28a745; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .tracking-info { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
            @media (max-width: 600px) {
                .container { border-radius: 0; }
                .content { padding: 20px; }
                .order-item { flex-direction: column; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Order Confirmed!</h1>
                <p>Thank you for your purchase</p>
            </div>
            
            <div class="content">
                <div class="success-badge">
                    <strong>Order Confirmed:</strong> Your order #${orderData.orderNumber} has been successfully placed.
                </div>
                
                <p>Hello <strong>${orderData.name}</strong>,</p>
                <p>Thank you for choosing Hanger Garments! We're preparing your order and will notify you once it's shipped.</p>
                
                <div class="order-summary">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">📦 Order Summary</h3>
                    <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                    <p><strong>Order Date:</strong> ${orderDate}</p>
                    <p><strong>Status:</strong> <span class="status-badge">${orderData.status}</span></p>
                </div>

                <div class="order-items">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">🛒 Order Items</h3>
                    ${orderData.orderItems.map(item => `
                    <div class="order-item">
                        <div class="item-details">
                            <strong>${item.product.name}</strong>
                            ${item.productVariant ? `<br><small>Variant: ${item.productVariant.color} - ${item.productVariant.size}</small>` : ''}
                            <br>
                            <small>Quantity: ${item.quantity} × ₹${item.price}</small>
                        </div>
                        <div class="item-price">
                            ₹${(item.quantity * item.price).toFixed(2)}
                        </div>
                    </div>
                    `).join('')}
                </div>

                <div class="amount-breakdown">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">💰 Amount Breakdown</h3>
                    <div class="breakdown-row">
                        <span>Subtotal:</span>
                        <span>₹${orderData.subtotal.toFixed(2)}</span>
                    </div>
                    ${orderData.discount > 0 ? `
                    <div class="breakdown-row" style="color: #28a745;">
                        <span>Discount:</span>
                        <span>-₹${orderData.discount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${orderData.coupon ? `
                    <div class="breakdown-row">
                        <span>Coupon Applied:</span>
                        <span>${orderData.coupon.code}</span>
                    </div>
                    ` : ''}
                    <div class="breakdown-row">
                        <span>Shipping:</span>
                        <span>₹${orderData.shippingCost.toFixed(2)}</span>
                    </div>
                    <div class="breakdown-row breakdown-total">
                        <span>Total Amount:</span>
                        <span>₹${orderData.totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                ${orderData.trackingNumber ? `
                <div class="tracking-info">
                    <h3 style="color: #1565c0; margin-bottom: 15px;">🚚 Tracking Information</h3>
                    <p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>
                    <p><strong>Carrier:</strong> ${orderData.carrier}</p>
                    ${orderData.trackingUrl ? `<p><strong>Track Your Order:</strong> <a href="${trackingUrl}" style="color: #1565c0;">Click here to track</a></p>` : ''}
                    ${orderData.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(orderData.estimatedDelivery).toLocaleDateString()}</p>` : ''}
                </div>
                ` : ''}

                <div class="shipping-info">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">🏠 Shipping Address</h3>
                    <p>${orderData.name}<br>
                    ${orderData.address}<br>
                    ${orderData.city}, ${orderData.state} - ${orderData.pincode}<br>
                    📞 ${orderData.phone}<br>
                    ✉️ ${orderData.email}</p>
                </div>

                <div class="payment-info">
                    <h3 style="color: #2d5e2d; margin-bottom: 15px;">💳 Payment Information</h3>
                    <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
                    <p><strong>Payment Status:</strong> <span class="status-badge">${orderData.paymentStatus}</span></p>
                    <p><strong>Payment ID:</strong> ${orderData.razorpayPaymentId}</p>
                </div>

                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #1565c0; margin-bottom: 10px;">📞 Need Help?</h4>
                    <p style="margin: 0;">If you have any questions about your order, contact our support team:</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${supportEmail}" style="color: #1565c0;">${supportEmail}</a></p>
                    <p style="margin: 0;"><strong>Phone:</strong> +91 98765 43210</p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Hanger Garments</strong></p>
                <p>Nourishing Lives Naturally</p>
                <p style="margin-top: 15px; font-size: 11px; color: #999;">
                    This is an automated order confirmation email. Please do not reply to this message.
                </p>
            </div>
        </div>
    </body>
    </html>
        `,
        text: `
    ORDER CONFIRMED - Hanger Garments

    Hello ${orderData.name},

    Thank you for your order! We're excited to let you know that we've received your order #${orderData.orderNumber} and it is now being processed.

    ORDER SUMMARY:
    --------------
    Order Number: ${orderData.orderNumber}
    Order Date: ${orderDate}
    Status: ${orderData.status}

    ORDER ITEMS:
    ------------
    ${orderData.orderItems.map(item => 
    `• ${item.product.name}${item.productVariant ? ` (${item.productVariant.color} - ${item.productVariant.size})` : ''} - ${item.quantity} × ₹${item.price} = ₹${(item.quantity * item.price).toFixed(2)}`
    ).join('\n')}

    AMOUNT BREAKDOWN:
    -----------------
    Subtotal: ₹${orderData.subtotal.toFixed(2)}
    ${orderData.discount > 0 ? `Discount: -₹${orderData.discount.toFixed(2)}\n` : ''}${orderData.coupon ? `Coupon Applied: ${orderData.coupon.code}\n` : ''}Shipping: ₹${orderData.shippingCost.toFixed(2)}
    Total: ₹${orderData.totalAmount.toFixed(2)}

    ${orderData.trackingNumber ? `
    TRACKING INFORMATION:
    ---------------------
    Tracking Number: ${orderData.trackingNumber}
    Carrier: ${orderData.carrier}
    ${orderData.trackingUrl ? `Track Your Order: ${trackingUrl}\n` : ''}${orderData.estimatedDelivery ? `Estimated Delivery: ${new Date(orderData.estimatedDelivery).toLocaleDateString()}\n` : ''}
    ` : ''}

    SHIPPING ADDRESS:
    -----------------
    ${orderData.name}
    ${orderData.address}
    ${orderData.city}, ${orderData.state} - ${orderData.pincode}
    Phone: ${orderData.phone}
    Email: ${orderData.email}

    PAYMENT INFORMATION:
    -------------------
    Payment Method: ${orderData.paymentMethod}
    Payment Status: ${orderData.paymentStatus}
    Payment ID: ${orderData.razorpayPaymentId}

    Need help? Contact our support team:
    Email: ${supportEmail}
    Phone: +91 98765 43210

    Thank you for choosing Hanger Garments!

    --
    Hanger Garments
    Nourishing Lives Naturally
        `.trim()
    };
    },

    orderConfirmationAdmin: (orderData) => {
    const orderDate = new Date(orderData.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const domain = process.env.DOMAIN_NAME || 'hangergarments.com';
    const adminUrl = process.env.ADMIN_URL || `https://admin.${domain}`;

    return {
        subject: `New Order Received - #${orderData.orderNumber} - ₹${orderData.totalAmount.toFixed(2)}`,
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification - Hanger Garments</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
            .container { max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear(135deg, #dc3545 0%, #c82333 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
            .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
            .content { padding: 30px; }
            .alert-badge { background: #ffe6e6; color: #dc3545; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #dc3545; }
            .order-overview { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 15px; }
            .overview-item { background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #dc3545; }
            .order-items { margin: 20px 0; }
            .order-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
            .amount-summary { background: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .summary-total { border-top: 2px solid #2d5e2d; font-weight: bold; font-size: 18px; }
            .customer-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
            .action-buttons { margin-top: 24px; text-align: center; }
            .btn { display: inline-block; padding: 12px 24px; margin: 0 8px; background: #dc3545; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; }
            .btn-outline { background: transparent; border: 2px solid #dc3545; color: #dc3545; }
            @media (max-width: 600px) {
                .container { border-radius: 0; }
                .content { padding: 20px; }
                .overview-grid { grid-template-columns: 1fr; }
                .order-item { flex-direction: column; }
                .btn { display: block; margin: 10px 0; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛒 New Order Received</h1>
                <p>Order #${orderData.orderNumber} - Requires Processing</p>
            </div>
            
            <div class="content">
                <div class="alert-badge">
                    <strong>New Order Alert:</strong> A new order has been placed and requires processing.
                </div>
                
                <div class="order-overview">
                    <h3 style="color: #dc3545; margin-bottom: 16px;">📊 Order Overview</h3>
                    <div class="overview-grid">
                        <div class="overview-item">
                            <strong>Order Number</strong><br>
                            ${orderData.orderNumber}
                        </div>
                        <div class="overview-item">
                            <strong>Order Date</strong><br>
                            ${orderDate}
                        </div>
                        <div class="overview-item">
                            <strong>Total Amount</strong><br>
                            ₹${orderData.totalAmount.toFixed(2)}
                        </div>
                        <div class="overview-item">
                            <strong>Payment Method</strong><br>
                            ${orderData.paymentMethod}
                        </div>
                    </div>
                </div>

                <div class="customer-info">
                    <h3 style="color: #dc3545; margin-bottom: 16px;">👤 Customer Information</h3>
                    <p><strong>Name:</strong> ${orderData.name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${orderData.email}" style="color: #dc3545;">${orderData.email}</a></p>
                    <p><strong>Phone:</strong> <a href="tel:${orderData.phone}" style="color: #dc3545;">${orderData.phone}</a></p>
                    <p><strong>Address:</strong> ${orderData.address}, ${orderData.city}, ${orderData.state} - ${orderData.pincode}</p>
                    ${orderData.user ? `<p><strong>Customer ID:</strong> ${orderData.user.id}</p>` : ''}
                </div>

                <div class="order-items">
                    <h3 style="color: #dc3545; margin-bottom: 16px;">📦 Order Items</h3>
                    ${orderData.orderItems.map(item => `
                    <div class="order-item">
                        <div style="flex: 2;">
                            <strong>${item.product.name}</strong>
                            ${item.productVariant ? `<br><small>Variant: ${item.productVariant.color} - ${item.productVariant.size}</small>` : ''}
                            <br>
                            <small>Quantity: ${item.quantity} × ₹${item.price}</small>
                        </div>
                        <div style="flex: 1; text-align: right;">
                            ₹${(item.quantity * item.price).toFixed(2)}
                        </div>
                    </div>
                    `).join('')}
                </div>

                <div class="amount-summary">
                    <h3 style="color: #2d5e2d; margin-bottom: 16px;">💰 Order Summary</h3>
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>₹${orderData.subtotal.toFixed(2)}</span>
                    </div>
                    ${orderData.discount > 0 ? `
                    <div class="summary-row" style="color: #28a745;">
                        <span>Discount:</span>
                        <span>-₹${orderData.discount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${orderData.coupon ? `
                    <div class="summary-row">
                        <span>Coupon Code:</span>
                        <span>${orderData.coupon.code}</span>
                    </div>
                    ` : ''}
                    <div class="summary-row">
                        <span>Shipping:</span>
                        <span>₹${orderData.shippingCost.toFixed(2)}</span>
                    </div>
                    <div class="summary-row summary-total">
                        <span>Grand Total:</span>
                        <span>₹${orderData.totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div class="action-buttons">
                    <a href="${adminUrl}/orders/${orderData.id}" class="btn">📋 View Order in Admin Panel</a>
                    <a href="mailto:${orderData.email}?subject=Regarding Order ${orderData.orderNumber}" class="btn btn-outline">✉️ Contact Customer</a>
                </div>

                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <h4 style="color: #856404; margin-bottom: 12px;">🚀 Next Steps:</h4>
                    <ol style="color: #856404; margin-left: 20px;">
                        <li>Review order details and verify payment</li>
                        <li>Prepare items for shipping</li>
                        <li>Update order status when shipped</li>
                        <li>Add tracking information</li>
                        <li>Notify customer when delivered</li>
                    </ol>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Hanger Garments - Order Management System</strong></p>
                <p>This is an automated notification. Please process this order promptly.</p>
                <p style="margin-top: 8px; font-size: 11px; color: #999;">
                    If you believe you received this email in error, please contact system administration.
                </p>
            </div>
        </div>
    </body>
    </html>
        `,
        text: `
    NEW ORDER NOTIFICATION - Hanger Garments

    A new order has been placed and requires processing.

    ORDER OVERVIEW:
    ---------------
    Order Number: ${orderData.orderNumber}
    Order Date: ${orderDate}
    Total Amount: ₹${orderData.totalAmount.toFixed(2)}
    Payment Method: ${orderData.paymentMethod}
    Payment Status: ${orderData.paymentStatus}

    CUSTOMER INFORMATION:
    --------------------
    Name: ${orderData.name}
    Email: ${orderData.email}
    Phone: ${orderData.phone}
    Address: ${orderData.address}, ${orderData.city}, ${orderData.state} - ${orderData.pincode}
    ${orderData.user ? `Customer ID: ${orderData.user.id}\n` : ''}

    ORDER ITEMS:
    -----------
    ${orderData.orderItems.map(item => 
    `• ${item.product.name}${item.productVariant ? ` (${item.productVariant.color} - ${item.productVariant.size})` : ''}
    Quantity: ${item.quantity} × ₹${item.price} = ₹${(item.quantity * item.price).toFixed(2)}`
    ).join('\n')}

    ORDER SUMMARY:
    -------------
    Subtotal: ₹${orderData.subtotal.toFixed(2)}
    ${orderData.discount > 0 ? `Discount: -₹${orderData.discount.toFixed(2)}\n` : ''}${orderData.coupon ? `Coupon Code: ${orderData.coupon.code}\n` : ''}Shipping: ₹${orderData.shippingCost.toFixed(2)}
    Grand Total: ₹${orderData.totalAmount.toFixed(2)}

    NEXT STEPS:
    ----------
    1. Review order details and verify payment
    2. Prepare items for shipping
    3. Update order status when shipped
    4. Add tracking information
    5. Notify customer when delivered

    View order in admin panel: ${adminUrl}/orders/${orderData.id}

    This is an automated order notification from Hanger Garments.

    --
    Hanger Garments
    Order Management System
        `.trim()
    };
    },

    orderStatusUpdate: (orderData, oldStatus, newStatus) => {
    const orderDate = new Date(orderData.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        subject: `Order ${newStatus} - #${orderData.orderNumber} - Hanger Garments`,
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update - Hanger Garments</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear(135deg, #2c5aa0 0%, #3a7bd5 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
            .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
            .content { padding: 30px; }
            .status-badge { display: inline-block; padding: 8px 16px; background: #28a745; color: white; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 10px 0; }
            .order-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .tracking-info { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
            @media (max-width: 600px) {
                .container { border-radius: 0; }
                .content { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📦 Order Status Updated</h1>
                <p>Your order #${orderData.orderNumber} has been updated</p>
            </div>
            
            <div class="content">
                <p>Hello <strong>${orderData.name}</strong>,</p>
                
                <p>Your order status has been updated from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>
                
                <div class="order-info">
                    <h3 style="color: #2c5aa0; margin-bottom: 15px;">Order Details</h3>
                    <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                    <p><strong>Order Date:</strong> ${orderDate}</p>
                    <p><strong>Current Status:</strong> <span class="status-badge">${newStatus}</span></p>
                    <p><strong>Total Amount:</strong> ₹${orderData.totalAmount.toFixed(2)}</p>
                </div>

                ${orderData.trackingNumber ? `
                <div class="tracking-info">
                    <h3 style="color: #1565c0; margin-bottom: 15px;">🚚 Tracking Information</h3>
                    <p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>
                    <p><strong>Carrier:</strong> ${orderData.carrier}</p>
                    ${orderData.trackingUrl ? `<p><strong>Track Your Order:</strong> <a href="${orderData.trackingUrl}" style="color: #1565c0;">Click here to track</a></p>` : ''}
                    ${orderData.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(orderData.estimatedDelivery).toLocaleDateString()}</p>` : ''}
                </div>
                ` : ''}

                ${newStatus === 'SHIPPED' ? `
                <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #155724; margin-bottom: 10px;">🎉 Your Order is on the Way!</h4>
                    <p style="margin: 0; color: #155724;">We've shipped your order. You can track its progress using the tracking information above.</p>
                </div>
                ` : ''}

                ${newStatus === 'DELIVERED' ? `
                <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #155724; margin-bottom: 10px;">🎊 Order Delivered Successfully!</h4>
                    <p style="margin: 0; color: #155724;">Your order has been delivered. We hope you love your purchase!</p>
                </div>
                ` : ''}

                <div style="margin-top: 20px;">
                    <p>Thank you for shopping with Hanger Garments!</p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Hanger Garments</strong></p>
                <p>Nourishing Lives Naturally</p>
                <p style="margin-top: 15px; font-size: 11px; color: #999;">
                    This is an automated status update email. Please do not reply to this message.
                </p>
            </div>
        </div>
    </body>
    </html>
        `,
        text: `
    ORDER STATUS UPDATE - Hanger Garments

    Hello ${orderData.name},

    Your order status has been updated from ${oldStatus} to ${newStatus}.

    ORDER DETAILS:
    --------------
    Order Number: ${orderData.orderNumber}
    Order Date: ${orderDate}
    Current Status: ${newStatus}
    Total Amount: ₹${orderData.totalAmount.toFixed(2)}

    ${orderData.trackingNumber ? `
    TRACKING INFORMATION:
    ---------------------
    Tracking Number: ${orderData.trackingNumber}
    Carrier: ${orderData.carrier}
    ${orderData.trackingUrl ? `Track Your Order: ${orderData.trackingUrl}\n` : ''}${orderData.estimatedDelivery ? `Estimated Delivery: ${new Date(orderData.estimatedDelivery).toLocaleDateString()}\n` : ''}
    ` : ''}

    ${newStatus === 'SHIPPED' ? `
    🎉 Your Order is on the Way!
    We've shipped your order. You can track its progress using the tracking information above.
    ` : ''}

    ${newStatus === 'DELIVERED' ? `
    🎊 Order Delivered Successfully!
    Your order has been delivered. We hope you love your purchase!
    ` : ''}

    Thank you for shopping with Hanger Garments!

    --
    Hanger Garments
    Nourishing Lives Naturally
        `.trim()
    };
    },

    orderRefundNotification: (orderData, refundData) => {
    const orderDate = new Date(orderData.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        subject: `Order Refund Processed - #${orderData.orderNumber} - Hanger Garments`,
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Refund - Hanger Garments</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f6f6f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear(135deg, #28a745 0%, #20c997 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
            .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
            .content { padding: 30px; }
            .refund-info { background: #d4edda; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .order-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
            @media (max-width: 600px) {
                .container { border-radius: 0; }
                .content { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Refund Processed</h1>
                <p>Your refund for order #${orderData.orderNumber} has been processed</p>
            </div>
            
            <div class="content">
                <p>Hello <strong>${orderData.name}</strong>,</p>
                
                <p>We have processed your refund for order <strong>#${orderData.orderNumber}</strong>.</p>
                
                <div class="refund-info">
                    <h3 style="color: #155724; margin-bottom: 15px;">Refund Details</h3>
                    <p><strong>Refund Amount:</strong> ₹${refundData.refundAmount.toFixed(2)}</p>
                    <p><strong>Refund Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Refund Reason:</strong> ${refundData.reason}</p>
                    ${refundData.razorpayRefundId ? `<p><strong>Refund ID:</strong> ${refundData.razorpayRefundId}</p>` : ''}
                    <p style="margin-top: 15px; color: #155724;"><strong>Note:</strong> The refund will reflect in your original payment method within 5-7 business days.</p>
                </div>

                <div class="order-info">
                    <h3 style="color: #495057; margin-bottom: 15px;">Order Details</h3>
                    <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                    <p><strong>Order Date:</strong> ${orderDate}</p>
                    <p><strong>Original Amount:</strong> ₹${orderData.totalAmount.toFixed(2)}</p>
                    <p><strong>Refunded Amount:</strong> ₹${refundData.refundAmount.toFixed(2)}</p>
                </div>

                <div style="margin-top: 20px;">
                    <p>If you have any questions about your refund, please contact our support team.</p>
                    <p>We hope to serve you better in the future.</p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Hanger Garments</strong></p>
                <p>Nourishing Lives Naturally</p>
                <p style="margin-top: 15px; font-size: 11px; color: #999;">
                    This is an automated refund notification email. Please do not reply to this message.
                </p>
            </div>
        </div>
    </body>
    </html>
        `,
        text: `
    ORDER REFUND PROCESSED - Hanger Garments

    Hello ${orderData.name},

    We have processed your refund for order #${orderData.orderNumber}.

    REFUND DETAILS:
    ---------------
    Refund Amount: ₹${refundData.refundAmount.toFixed(2)}
    Refund Date: ${new Date().toLocaleDateString()}
    Refund Reason: ${refundData.reason}
    ${refundData.razorpayRefundId ? `Refund ID: ${refundData.razorpayRefundId}\n` : ''}
    Note: The refund will reflect in your original payment method within 5-7 business days.

    ORDER DETAILS:
    --------------
    Order Number: ${orderData.orderNumber}
    Order Date: ${orderDate}
    Original Amount: ₹${orderData.totalAmount.toFixed(2)}
    Refunded Amount: ₹${refundData.refundAmount.toFixed(2)}

    If you have any questions about your refund, please contact our support team.
    We hope to serve you better in the future.

    --
    Hanger Garments
    Nourishing Lives Naturally
        `.trim()
    };
    }

};