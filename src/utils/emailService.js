// Email service for sending SOS notifications via Supabase Edge Function
import { supabase } from '../supabaseClient';

export const sendSOSEmail = async (to, userInfo, location, message) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-sos-email', {
      body: {
        to,
        userInfo,
        location,
        message,
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to send SOS email');
    }

    return data;
  } catch (error) {
    console.error('Error sending SOS email:', error);
    throw error;
  }
};

// Helper function to create HTML email content
const createSOSEmailHTML = (userInfo, location, message, timestamp, googleMapsUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Emergency Alert - CareConnect</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-radius: 8px;
          color: white;
        }
        .alert-icon {
          font-size: 48px;
          margin-bottom: 10px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .info-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #ef4444;
        }
        .location-section {
          background: #ecfdf5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #10b981;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #ef4444;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 10px 5px;
          text-align: center;
        }
        .timestamp {
          background: #fef3c7;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          margin: 20px 0;
          border: 1px solid #f59e0b;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="alert-icon">🚨</div>
          <h1 style="margin: 0; font-size: 24px;">EMERGENCY ALERT</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Immediate assistance required</p>
        </div>

        <div class="info-section">
          <h2 style="color: #ef4444; margin-top: 0;">Person in Need</h2>
          <p><strong>Name:</strong> ${userInfo.name || 'CareConnect User'}</p>
          <p><strong>Phone:</strong> ${userInfo.phone || 'Available in app'}</p>
          <p><strong>Email:</strong> ${userInfo.email || 'Available in app'}</p>
        </div>

        <div class="timestamp">
          <strong>Alert Time:</strong> ${new Date(timestamp).toLocaleString()}
        </div>

        <div class="location-section">
          <h2 style="color: #059669; margin-top: 0;">📍 Current Location</h2>
          <p><strong>Coordinates:</strong> ${location}</p>
          <p style="margin-bottom: 20px;"><strong>Emergency Message:</strong> ${message}</p>
          
          <div style="text-align: center;">
            <a href="${googleMapsUrl}" class="button" style="background: #059669;">
              🗺️ View Location on Google Maps
            </a>
            <a href="tel:${userInfo.phone || ''}" class="button">
              📞 Call Now
            </a>
          </div>
        </div>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">⚠️ What to do:</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Contact the person immediately using the phone number above</li>
            <li>If no response, consider calling emergency services (911)</li>
            <li>Use the location link to navigate to their position</li>
            <li>Check the CareConnect app for real-time updates</li>
          </ol>
        </div>

        <div class="footer">
          <p>This is an automated emergency alert from CareConnect.</p>
          <p>If this is a false alarm, please contact the person to confirm their safety.</p>
          <p style="margin-top: 15px;">
            <strong>CareConnect</strong> - Connecting communities for elderly care
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to create text email content
const createSOSEmailText = (userInfo, location, message, timestamp, googleMapsUrl) => {
  return `
🚨 EMERGENCY ALERT - CareConnect

${userInfo.name || 'A CareConnect user'} has triggered an emergency alert and needs immediate assistance.

Person Details:
- Name: ${userInfo.name || 'CareConnect User'}
- Phone: ${userInfo.phone || 'Available in app'}
- Email: ${userInfo.email || 'Available in app'}

Alert Time: ${new Date(timestamp).toLocaleString()}
Location: ${location}
Message: ${message}

View location: ${googleMapsUrl}

IMMEDIATE ACTION REQUIRED:
1. Call them at ${userInfo.phone || 'number in app'}
2. If no response, call emergency services
3. Navigate to their location using the link above

This is an automated emergency alert from CareConnect.
  `;
};

// Email template for SOS notifications
export const createSOSEmailTemplate = (userInfo, location, message, timestamp) => {
  const googleMapsUrl = `https://www.google.com/maps?q=${location}`;
  
  return {
    subject: `🚨 EMERGENCY ALERT - ${userInfo.name || 'CareConnect User'} needs immediate assistance`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Emergency Alert - CareConnect</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border-radius: 8px;
            color: white;
          }
          .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ef4444;
          }
          .location-section {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #ef4444;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 5px;
            text-align: center;
          }
          .button:hover {
            background: #dc2626;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .timestamp {
            background: #fef3c7;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            margin: 20px 0;
            border: 1px solid #f59e0b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="alert-icon">🚨</div>
            <h1 style="margin: 0; font-size: 24px;">EMERGENCY ALERT</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Immediate assistance required</p>
          </div>

          <div class="info-section">
            <h2 style="color: #ef4444; margin-top: 0;">Person in Need</h2>
            <p><strong>Name:</strong> ${userInfo.name || 'CareConnect User'}</p>
            <p><strong>Phone:</strong> ${userInfo.phone || 'Available in app'}</p>
            <p><strong>Email:</strong> ${userInfo.email || 'Available in app'}</p>
          </div>

          <div class="timestamp">
            <strong>Alert Time:</strong> ${new Date(timestamp).toLocaleString()}
          </div>

          <div class="location-section">
            <h2 style="color: #059669; margin-top: 0;">📍 Current Location</h2>
            <p><strong>Coordinates:</strong> ${location}</p>
            <p style="margin-bottom: 20px;"><strong>Emergency Message:</strong> ${message}</p>
            
            <div style="text-align: center;">
              <a href="${googleMapsUrl}" class="button" style="background: #059669;">
                🗺️ View Location on Google Maps
              </a>
              <a href="tel:${userInfo.phone || ''}" class="button">
                📞 Call Now
              </a>
            </div>
          </div>

          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">⚠️ What to do:</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Contact the person immediately using the phone number above</li>
              <li>If no response, consider calling emergency services (911)</li>
              <li>Use the location link to navigate to their position</li>
              <li>Check the CareConnect app for real-time updates</li>
            </ol>
          </div>

          <div class="footer">
            <p>This is an automated emergency alert from CareConnect.</p>
            <p>If this is a false alarm, please contact the person to confirm their safety.</p>
            <p style="margin-top: 15px;">
              <strong>CareConnect</strong> - Connecting communities for elderly care
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
🚨 EMERGENCY ALERT - CareConnect

${userInfo.name || 'A CareConnect user'} has triggered an emergency alert and needs immediate assistance.

Person Details:
- Name: ${userInfo.name || 'CareConnect User'}
- Phone: ${userInfo.phone || 'Available in app'}
- Email: ${userInfo.email || 'Available in app'}

Alert Time: ${new Date(timestamp).toLocaleString()}
Location: ${location}
Message: ${message}

View location: ${googleMapsUrl}

IMMEDIATE ACTION REQUIRED:
1. Call them at ${userInfo.phone || 'number in app'}
2. If no response, call emergency services
3. Navigate to their location using the link above

This is an automated emergency alert from CareConnect.
    `
  };
};
