/**
 * Email Service
 * Handles:
 *   - OTP emails (registration & login)
 *   - Design-created notification
 *   - Unacknowledged-design alert
 *   - Order notification
 *
 * NOTE: No internal IDs (user_id, design.id, etc.) are exposed in
 * customer-facing email bodies per product requirement #5.
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// ---------------------------------------------------------------------------
// Transporter factory
// ---------------------------------------------------------------------------
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
};

// ---------------------------------------------------------------------------
// OTP Email
// ---------------------------------------------------------------------------
/**
 * Send a 6-digit OTP to the user's email.
 * @param {string} email     - recipient address
 * @param {string} name      - recipient's display name
 * @param {string} otp       - 6-digit code
 * @param {'registration'|'login'} purpose
 */
const sendOtpEmail = async (email, name, otp, purpose = 'login') => {
    try {
        const transporter = createTransporter();

        const isRegistration = purpose === 'registration';
        const subject = isRegistration
            ? '🔑 Your Vanaja Jewellery Registration OTP'
            : '🔑 Your Vanaja Jewellery Login OTP';
        const heading = isRegistration
            ? 'Complete Your Registration'
            : 'Your One-Time Login Code';
        const bodyText = isRegistration
            ? 'Use the OTP below to verify your email and complete registration.'
            : 'Use the OTP below to log in to your Vanaja Jewellery account.';

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #333;">
                <h2 style="color: #b8860b;">${heading}</h2>
                <p>Hi ${name},</p>
                <p>${bodyText}</p>

                <div style="background: #fff8e1; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #555;">Your OTP</p>
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #b8860b;">${otp}</span>
                </div>

                <p style="font-size: 13px; color: #666;">
                    This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
                </p>

                <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #ddd;">
                    <p style="color: #888; font-size: 12px;">
                        This is an automated email from Vanaja Jewellery. Please do not reply.
                    </p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject,
            html
        });

        logger.info(`OTP email (${purpose}) sent to: ${email}`);
    } catch (error) {
        logger.error('Error sending OTP email:', error);
        // Do NOT rethrow – let the controller decide
        throw error;
    }
};

// ---------------------------------------------------------------------------
// Design Created Notification
// ---------------------------------------------------------------------------
/**
 * @param {Object} design - Design object
 * @param {Object} user   - User who created the design { name, email, phone }
 */
const sendDesignCreatedNotification = async (design, user) => {
    try {
        const transporter = createTransporter();
        const path = require('path');

        const attachments = [];
        let imagesHtml = '';

        if (design.reference_images && design.reference_images.length > 0) {
            design.reference_images.forEach((imageName, index) => {
                const imagePath = path.join(process.cwd(), 'uploads', 'designs', imageName);
                const cid = `image${index}@vanajajewellery`;

                attachments.push({ filename: imageName, path: imagePath, cid });

                imagesHtml += `
                    <div style="margin: 10px 0;">
                        <img src="cid:${cid}" alt="Reference Image ${index + 1}"
                             style="max-width: 100%; height: auto; border-radius: 5px; border: 1px solid #ddd;" />
                        <p style="font-size: 12px; color: #666; margin: 5px 0;">${imageName}</p>
                    </div>
                `;
            });
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New Custom Design Request Received</h2>

                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #555; margin-top: 0;">Design Details</h3>
                    <p><strong>Design Name:</strong> ${design.design_name}</p>
                    <p><strong>Material Preference:</strong> ${design.material_preference}</p>
                    <p><strong>Approximate Weight:</strong> ${design.approximate_weight} grams</p>
                    <p><strong>Description:</strong> ${design.description || 'N/A'}</p>
                    <p><strong>Request:</strong> ${design.request}</p>
                    <p><strong>Work Status:</strong> ${design.work_status}</p>
                    <p><strong>Created At:</strong> ${new Date(design.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                </div>

                <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #555; margin-top: 0;">Customer Information</h3>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Phone:</strong> ${user.phone}</p>
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
        `;

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.SHOP_EMAIL,
            subject: `New Custom Design Request - ${design.design_name}`,
            html,
            attachments
        });

        logger.info(`Design creation notification sent for design: ${design.design_name}`);
    } catch (error) {
        logger.error('Error sending design creation notification:', error);
    }
};

// ---------------------------------------------------------------------------
// Unacknowledged Design Alert
// ---------------------------------------------------------------------------
/**
 * @param {Array} designs - Array of unacknowledged design objects with user info
 */
const sendUnacknowledgedDesignAlert = async (designs) => {
    try {
        if (!designs || designs.length === 0) return;

        const transporter = createTransporter();

        const designList = designs.map(d => `
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;">
                <p><strong>Design:</strong> ${d.design_name}</p>
                <p><strong>Customer:</strong> ${d.user_name} (${d.user_email})</p>
                <p><strong>Material:</strong> ${d.material_preference}</p>
                <p><strong>Created:</strong> ${new Date(d.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                <p><strong>Time Elapsed:</strong> ${getTimeElapsed(d.created_at)}</p>
            </div>
        `).join('');

        await transporter.sendMail({
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
        });

        logger.info(`Unacknowledged design alert sent for ${designs.length} design(s)`);
    } catch (error) {
        logger.error('Error sending unacknowledged design alert:', error);
    }
};

// ---------------------------------------------------------------------------
// Order Notification
// ---------------------------------------------------------------------------
/**
 * @param {Array}  orderItems - Array of enriched order_items rows (with product_images)
 * @param {Object} user       - { name, email, phone }
 */
const sendOrderNotification = async (orderItems, user) => {
    try {
        if (!orderItems || orderItems.length === 0) return;

        const transporter = createTransporter();

        const totalFinalPrice = orderItems
            .reduce((sum, item) => sum + parseFloat(item.final_price || 0), 0)
            .toFixed(2);

        const orderRowsHtml = orderItems.map((item, idx) => `
            <tr style="background: ${idx % 2 === 0 ? '#f9f9f9' : '#fff'}">
                <td style="padding:8px 12px; border:1px solid #ddd;">${item.product_name}</td>
                <td style="padding:8px 12px; border:1px solid #ddd;">${item.metal || '-'} ${item.metal_purity || ''}</td>
                <td style="padding:8px 12px; border:1px solid #ddd;">${parseFloat(item.weight).toFixed(3)} g${item.user_weight ? ` <em style="color:#888;">(custom: ${parseFloat(item.user_weight).toFixed(3)} g)</em>` : ''}</td>
                <td style="padding:8px 12px; border:1px solid #ddd;">${item.size || '—'}</td>
                <td style="padding:8px 12px; border:1px solid #ddd;">${item.chain_length ? `${item.chain_length}"` : '—'}</td>
                <td style="padding:8px 12px; border:1px solid #ddd;">₹${parseFloat(item.metal_rate_per_gram).toFixed(2)}/g</td>
                <td style="padding:8px 12px; border:1px solid #ddd;">₹${parseFloat(item.final_price).toFixed(2)}</td>
            </tr>
        `).join('');

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color:#333;">
                <h2 style="color:#b8860b;">🛒 New Order Placed – Vanaja Jewellery</h2>

                <div style="background:#fff8e1; padding:16px; border-radius:6px; margin-bottom:20px;">
                    <h3 style="margin-top:0; color:#555;">Customer Details</h3>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                    <p><strong>Order Date:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                </div>

                <h3 style="color:#555;">Order Items (${orderItems.length})</h3>
                <table style="border-collapse:collapse; width:100%; font-size:14px;">
                    <thead>
                        <tr style="background:#b8860b; color:#fff;">
                            <th style="padding:8px 12px; border:1px solid #ddd; text-align:left;">Product</th>
                            <th style="padding:8px 12px; border:1px solid #ddd; text-align:left;">Metal</th>
                            <th style="padding:8px 12px; border:1px solid #ddd; text-align:left;">Weight</th>
                            <th style="padding:8px 12px; border:1px solid #ddd; text-align:left;">Size</th>
                            <th style="padding:8px 12px; border:1px solid #ddd; text-align:left;">Chain</th>
                            <th style="padding:8px 12px; border:1px solid #ddd; text-align:left;">Metal Rate</th>
                            <th style="padding:8px 12px; border:1px solid #ddd; text-align:left;">Final Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr style="background:#f0f0f0; font-weight:bold;">
                            <td colspan="6" style="padding:8px 12px; border:1px solid #ddd; text-align:right;">Grand Total</td>
                            <td style="padding:8px 12px; border:1px solid #ddd;">₹${totalFinalPrice}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top:30px; padding-top:16px; border-top:1px solid #ddd;">
                    <p style="color:#888; font-size:12px;">This is an automated notification from Vanaja Jewellery E-commerce System.</p>
                </div>
            </div>
        `;

        const recipients = [
            process.env.SHOP_EMAIL,
            process.env.OWNER_EMAIL,
        ].filter(Boolean).join(',');

        await transporter.sendMail({
            from:    process.env.SMTP_FROM || process.env.SMTP_USER,
            to:      recipients,
            subject: `🛒 New Order – ${user.name} | ${orderItems.length} item(s) | ₹${totalFinalPrice}`,
            html:    htmlBody,
        });

        logger.info(`Order notification email sent for ${orderItems.length} item(s) placed by user ${user.email}`);
    } catch (error) {
        logger.error('Error sending order notification email:', error);
    }
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getTimeElapsed = (createdAt) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours} hour(s) ${diffMinutes} minute(s)`;
};

module.exports = {
    sendOtpEmail,
    sendDesignCreatedNotification,
    sendUnacknowledgedDesignAlert,
    sendOrderNotification,
};
