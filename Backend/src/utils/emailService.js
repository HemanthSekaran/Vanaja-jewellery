/**
 * Email Service
 * Handles sending emails for design notifications
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
};

/**
 * Send email notification when a new design is created
 * @param {Object} design - Design object
 * @param {Object} user - User object who created the design
 */
const sendDesignCreatedNotification = async (design, user) => {
    try {
        const transporter = createTransporter();
        const path = require('path');

        // Prepare attachments for images
        const attachments = [];
        let imagesHtml = '';

        if (design.reference_images && design.reference_images.length > 0) {
            design.reference_images.forEach((imageName, index) => {
                const imagePath = path.join(process.cwd(), 'uploads', 'designs', imageName);
                const cid = `image${index}@vanajajewellery`;

                // Add attachment
                attachments.push({
                    filename: imageName,
                    path: imagePath,
                    cid: cid
                });

                // Build HTML for embedded images
                imagesHtml += `
                    <div style="margin: 10px 0;">
                        <img src="cid:${cid}" alt="Reference Image ${index + 1}" style="max-width: 100%; height: auto; border-radius: 5px; border: 1px solid #ddd;" />
                        <p style="font-size: 12px; color: #666; margin: 5px 0;">${imageName}</p>
                    </div>
                `;
            });
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.SHOP_EMAIL,
            subject: `New Custom Design Request - ${design.design_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">New Custom Design Request Received</h2>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #555; margin-top: 0;">Design Details</h3>
                        <p><strong>Design Name:</strong> ${design.design_name}</p>
                        <p><strong>Material Preference:</strong> ${design.material_preference}</p>
                        <p><strong>Approximate Weight:</strong> ${design.approximate_weight} grams</p>
                        <p><strong>Description:</strong> ${design.description || 'N/A'}</p>
                        <p><strong>Status:</strong> ${design.status}</p>
                        <p><strong>Design ID:</strong> ${design.id}</p>
                        <p><strong>Created At:</strong> ${new Date(design.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                    </div>

                    <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #555; margin-top: 0;">Customer Information</h3>
                        <p><strong>Name:</strong> ${user.name}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Phone:</strong> ${user.phone}</p>
                        <p><strong>User ID:</strong> ${user.id}</p>
                    </div>

                    ${design.reference_images && design.reference_images.length > 0 ? `
                    <div style="margin: 20px 0;">
                        <h3 style="color: #555;">Reference Images (${design.reference_images.length})</h3>
                        ${imagesHtml}
                    </div>
                    ` : ''}

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                        <p style="color: #666; font-size: 12px;">
                            This is an automated notification from Vanaja Jewellery E-commerce System.
                        </p>
                    </div>
                </div>
            `,
            attachments: attachments
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Design creation notification sent for design ID: ${design.id}`);
    } catch (error) {
        logger.error('Error sending design creation notification:', error);
        // Don't throw error - email failure shouldn't break the design creation
    }
};

/**
 * Send alert email for unacknowledged designs (after 3 hours)
 * @param {Array} designs - Array of unacknowledged design objects with user info
 */
const sendUnacknowledgedDesignAlert = async (designs) => {
    try {
        if (!designs || designs.length === 0) {
            return;
        }

        const transporter = createTransporter();

        const designList = designs.map(d => `
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;">
                <p><strong>Design:</strong> ${d.design_name} (ID: ${d.id})</p>
                <p><strong>Customer:</strong> ${d.user_name} (${d.user_email})</p>
                <p><strong>Material:</strong> ${d.material_preference}</p>
                <p><strong>Created:</strong> ${new Date(d.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                <p><strong>Time Elapsed:</strong> ${getTimeElapsed(d.created_at)}</p>
            </div>
        `).join('');

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.OWNER_EMAIL,
            subject: `⚠️ Alert: ${designs.length} Unacknowledged Design Request(s)`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d9534f;">⚠️ Unacknowledged Design Requests Alert</h2>
                    
                    <p style="color: #333; font-size: 16px;">
                        The following design request(s) have not been acknowledged for more than 3 hours:
                    </p>

                    ${designList}

                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #555; margin-top: 0;">Action Required</h3>
                        <p>Please review and acknowledge these design requests as soon as possible.</p>
                        <p><strong>Total Pending:</strong> ${designs.length} design(s)</p>
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                        <p style="color: #666; font-size: 12px;">
                            This is an automated alert from Vanaja Jewellery E-commerce System.<br>
                            Alert triggered at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Unacknowledged design alert sent for ${designs.length} design(s)`);
    } catch (error) {
        logger.error('Error sending unacknowledged design alert:', error);
    }
};

/**
 * Helper function to calculate time elapsed
 * @param {Date} createdAt - Creation timestamp
 * @returns {string} Human readable time elapsed
 */
const getTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours} hour(s) ${diffMinutes} minute(s)`;
};

module.exports = {
    sendDesignCreatedNotification,
    sendUnacknowledgedDesignAlert
};
