const daysToSeconds = (days) => {
    return Math.round(days * 86400);
};

const daysToMilliSeconds = (days) => {
    return Math.round(days * 86400 * 1000);
};

const calculateExpireDate = (startDate, duration) => {
    return 
};

module.exports = { daysToSeconds, daysToMilliSeconds }