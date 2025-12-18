/**
 * Scheduled Jobs Service
 * Handles periodic tasks like checking for unacknowledged designs
 */

const cron = require('node-cron');
const { query } = require('../config/database');
const { sendUnacknowledgedDesignAlert } = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * Check for designs that haven't been acknowledged within 3 hours
 * Runs every hour
 */
const checkUnacknowledgedDesigns = cron.schedule('0 * * * *', async () => {
    try {
        logger.info('Running scheduled job: Check unacknowledged designs');

        // Calculate timestamp for 3 hours ago
        const threeHoursAgo = new Date();
        threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

        // Query for designs created more than 3 hours ago that haven't been acknowledged
        // and alert hasn't been sent yet
        const unacknowledgedDesigns = await query(
            `SELECT cd.*, u.name as user_name, u.email as user_email, u.phone as user_phone
            FROM custom_designs cd
            JOIN users u ON cd.user_id = u.id
            WHERE cd.created_at <= ?
            AND cd.status != 'acknowledge'
            AND cd.alert_sent = FALSE
            ORDER BY cd.created_at ASC`,
            [threeHoursAgo]
        );

        if (unacknowledgedDesigns.length > 0) {
            logger.info(`Found ${unacknowledgedDesigns.length} unacknowledged design(s)`);

            // Send alert email
            await sendUnacknowledgedDesignAlert(unacknowledgedDesigns);

            // Mark designs as alert sent
            const designIds = unacknowledgedDesigns.map(d => d.id);
            await query(
                `UPDATE custom_designs SET alert_sent = TRUE WHERE id IN (${designIds.join(',')})`,
                []
            );

            logger.info(`Alert email sent and flag updated for ${unacknowledgedDesigns.length} unacknowledged design(s)`);
        } else {
            logger.info('No unacknowledged designs found');
        }
    } catch (error) {
        logger.error('Error in checkUnacknowledgedDesigns scheduled job:', error);
    }
});

/**
 * Initialize all scheduled jobs
 */
const initScheduledJobs = () => {
    logger.info('Initializing scheduled jobs...');

    // Start the unacknowledged designs check job
    checkUnacknowledgedDesigns.start();
    logger.info('✓ Unacknowledged designs check job started (runs every hour)');

    logger.info('All scheduled jobs initialized successfully');
};

/**
 * Stop all scheduled jobs (useful for graceful shutdown)
 */
const stopScheduledJobs = () => {
    logger.info('Stopping scheduled jobs...');
    checkUnacknowledgedDesigns.stop();
    logger.info('All scheduled jobs stopped');
};

module.exports = {
    initScheduledJobs,
    stopScheduledJobs,
    checkUnacknowledgedDesigns
};
