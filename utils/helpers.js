// Utility functions
const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const calculateTimeDiff = (startDate, endDate) => {
    const diff = new Date(endDate) - new Date(startDate);
    return Math.round(diff / 60000); // Return minutes
};

module.exports = { formatTime, formatDate, calculateTimeDiff };
