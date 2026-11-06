const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { customerEmail, customerName, orderId, status, trackingNumber, trackingCarrier } = JSON.parse(event.body || '{}');

    if (!customerEmail) {
      return { statusCode: 400, body: 'Missing recipient contact mapping.' };
    }

    let emailSubject = `Update on your lidar.rentals Order #${orderId.slice(0, 8)}`;
    let emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b;">Hello ${customerName || 'Customer'},</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Your rental order status has been updated to: <strong style="color: #2563eb; text-transform: uppercase;">${status}</strong>.
        </p>
    `;

    if (status === 'shipped' && trackingNumber) {
      emailSubject = `Your lidar.rentals package has shipped! 🚚`;
      emailHtml += `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #0f172a;">Shipping Logistics Details:</h4>
          <p style="margin: 5px 0; font-size: 14px; color: #475569;"><strong>Carrier:</strong> ${trackingCarrier || 'UPS'}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #475569;"><strong>Tracking Number:</strong> <code style="font-weight: bold; color: #0f172a;">${trackingNumber}</code></p>
        </div>
        <p style="color: #475569; font-size: 14px;">A prepaid return courier label has been enclosed inside your delivery box packet for easy dropoff when your rental period ends.</p>
      `;
    } else {
      emailHtml += `<p style="color: #475569; font-size: 14px;">Log into your <a href="${event.headers.origin || 'https://yoursite.com'}/#/account" style="color: #2563eb; font-weight: bold; text-decoration: none;">Customer Account Dashboard</a> to view receipts, track updates, or submit documentation updates.</p>`;
    }

    emailHtml += `
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated notification from lidar.rentals. Please do not reply directly to this message.</p>
      </div>
    `;

    await resend.emails.send({
      from: 'lidar.rentals Fulfillment <onboarding@resend.dev>',
      to: customerEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ sent: true })
    };

  } catch (error) {
    console.error("Email Automation Crash Error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to fire notification parameters.", details: error.message })
    };
  }
};
