const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

require('dotenv').config();

const { testConnection } = require('./src/config/database');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');
const { initScheduledJobs } = require('./src/services/scheduledJobs');


const authRoutes = require('./src/routes/authRoutes');
const designRoutes = require('./src/routes/designRoutes');
const productRoutes = require('./src/routes/productRoutes');
const metalPriceRoutes = require('./src/routes/metalPriceRoutes');
const wastageRoutes = require('./src/routes/wastageRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));




app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});


app.use('/api/auth', authRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/products', productRoutes);
app.use('/api/metal-prices', metalPriceRoutes);
app.use('/api/wastage', wastageRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFound);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;


const startServer = async () => {
    try {
        const dbConnected = await testConnection();

        if (!dbConnected) {
            logger.error('Failed to connect to database. Please check your database configuration.');
            process.exit(1);
        }

        app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/health\n`);

            // Initialize scheduled jobs
            initScheduledJobs();
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};


process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    process.exit(1);
});


process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});


startServer();

module.exports = app;
