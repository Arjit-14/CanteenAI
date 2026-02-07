/**
 * AI Scheduler Service
 * Handles time slot feasibility, kitchen load prediction, and prep time scheduling
 */

class AIScheduler {
    constructor(kitchenCapacity = 5) {
        this.kitchenCapacity = kitchenCapacity;
        this.bufferTime = 2; // minutes buffer before pickup
    }

    /**
     * Calculate rush intensity based on time of day
     * @param {Date} time - The time to check
     * @returns {number} 0-1 scale (0 = no rush, 1 = peak rush)
     */
    calculateRushIntensity(time) {
        const hour = time.getHours();
        const minute = time.getMinutes();
        const timeValue = hour + minute / 60;

        // Peak hours configuration
        const rushWindows = [
            { start: 9, end: 10, intensity: 0.9 },   // Morning break
            { start: 12, end: 13.5, intensity: 1.0 }, // Lunch rush
            { start: 15.5, end: 17, intensity: 0.7 }  // Evening snacks
        ];

        for (const window of rushWindows) {
            if (timeValue >= window.start && timeValue < window.end) {
                return window.intensity;
            }
        }
        return 0.2; // Off-peak baseline
    }

    /**
     * Get orders within a specific time window
     * @param {Array} activeOrders - All active orders
     * @param {Date} startTime - Window start
     * @param {Date} endTime - Window end
     * @returns {Array} Orders in the window
     */
    getOrdersInWindow(activeOrders, startTime, endTime) {
        return activeOrders.filter(order => {
            const orderPrepTime = new Date(order.scheduledPrepTime);
            const orderPickup = new Date(order.pickupSlot.end);
            return orderPrepTime < endTime && orderPickup > startTime;
        });
    }

    /**
     * Calculate current kitchen load from orders
     * @param {Array} orders - Orders to count
     * @returns {number} Total item count
     */
    calculateKitchenLoad(orders) {
        return orders.reduce((sum, order) => {
            return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);
    }

    /**
     * Calculate maximum prep time from order items
     * @param {Array} items - Order items
     * @returns {number} Maximum prep time in minutes
     */
    getMaxPrepTime(items) {
        if (!items || items.length === 0) return 0;
        return Math.max(...items.map(item => item.prepTime || 10));
    }

    /**
     * Calculate when cooking must start
     * Formula: StartCookTime = PickupTime - MaxPrepTime - BufferTime
     * @param {Date} pickupTime - Student's pickup time
     * @param {number} maxPrepTime - Maximum preparation time
     * @returns {Date} When to start cooking
     */
    calculatePrepStartTime(pickupTime, maxPrepTime) {
        return new Date(
            pickupTime.getTime() - (maxPrepTime + this.bufferTime) * 60000
        );
    }

    /**
     * Find next available slot when requested slot is busy
     * @param {Date} requestedTime - Originally requested pickup time
     * @param {number} itemCount - Number of items to prepare
     * @param {Array} activeOrders - Current active orders
     * @param {number} capacity - Effective kitchen capacity
     * @returns {Object} Next available slot
     */
    findNextAvailableSlot(requestedTime, itemCount, activeOrders, capacity) {
        let checkTime = new Date(requestedTime);
        const maxAttempts = 12; // Check up to 2 hours ahead (10-min slots)

        for (let i = 0; i < maxAttempts; i++) {
            checkTime = new Date(checkTime.getTime() + 10 * 60000); // Add 10 minutes

            const windowOrders = this.getOrdersInWindow(
                activeOrders,
                new Date(checkTime.getTime() - 15 * 60000),
                checkTime
            );
            const load = this.calculateKitchenLoad(windowOrders);

            if (load + itemCount <= capacity) {
                return {
                    start: checkTime,
                    end: new Date(checkTime.getTime() + 10 * 60000)
                };
            }
        }

        // Fallback: return a slot 2 hours later
        return {
            start: new Date(requestedTime.getTime() + 120 * 60000),
            end: new Date(requestedTime.getTime() + 130 * 60000)
        };
    }

    /**
     * Main function: Check if a requested time slot is feasible
     * @param {Date} pickupTime - Student's requested pickup time
     * @param {Array} items - Items being ordered with prepTime
     * @param {Array} activeOrders - Current orders in the system
     * @param {number} customCapacity - Optional custom kitchen capacity
     * @returns {Object} { feasible, scheduledPrepTime, suggestedSlot, reason }
     */
    checkSlotFeasibility(pickupTime, items, activeOrders, customCapacity = null) {
        const capacity = customCapacity || this.kitchenCapacity;
        const maxPrepTime = this.getMaxPrepTime(items);
        const totalItemCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

        // Calculate required cooking start time
        const requiredStartTime = this.calculatePrepStartTime(pickupTime, maxPrepTime);

        // Check if start time is in the past
        if (requiredStartTime < new Date()) {
            const minimumPickup = new Date(Date.now() + (maxPrepTime + this.bufferTime) * 60000);
            return {
                feasible: false,
                reason: 'Pickup time too soon. Kitchen needs more preparation time.',
                suggestedSlot: {
                    start: minimumPickup,
                    end: new Date(minimumPickup.getTime() + 10 * 60000)
                }
            };
        }

        // Get concurrent orders in the cooking window
        const concurrentOrders = this.getOrdersInWindow(
            activeOrders,
            requiredStartTime,
            pickupTime
        );

        const currentLoad = this.calculateKitchenLoad(concurrentOrders);
        const rushIntensity = this.calculateRushIntensity(pickupTime);

        // Effective capacity decreases during rush hours
        const effectiveCapacity = Math.floor(capacity * (1 - rushIntensity * 0.3));

        // Check if slot is available
        if (currentLoad + totalItemCount <= Math.max(effectiveCapacity, 2)) {
            return {
                feasible: true,
                scheduledPrepTime: requiredStartTime,
                estimatedWait: 0,
                currentLoad,
                effectiveCapacity,
                rushIntensity,
                reason: 'Slot available'
            };
        }

        // Find alternative slot
        const suggestedSlot = this.findNextAvailableSlot(
            pickupTime,
            totalItemCount,
            activeOrders,
            effectiveCapacity
        );

        return {
            feasible: false,
            suggestedSlot,
            currentLoad,
            effectiveCapacity,
            rushIntensity,
            reason: `Slot busy (${currentLoad}/${effectiveCapacity} capacity). Try suggested time.`
        };
    }

    /**
     * Predict queue delay based on current orders
     * @param {Array} activeOrders - Current active orders
     * @param {string} canteenId - Canteen to check
     * @returns {number} Estimated delay in minutes
     */
    predictQueueDelay(activeOrders, canteenId) {
        const canteenOrders = activeOrders.filter(
            order => order.canteenId.toString() === canteenId &&
                ['preparing', 'confirmed'].includes(order.status)
        );

        if (canteenOrders.length === 0) return 0;

        const avgPrepTime = canteenOrders.reduce((sum, order) => {
            return sum + this.getMaxPrepTime(order.items);
        }, 0) / canteenOrders.length;

        return Math.ceil(avgPrepTime / this.kitchenCapacity);
    }

    /**
     * Generate time slots for the next few hours
     * @param {number} hours - Number of hours to generate slots for
     * @param {number} intervalMinutes - Interval between slots
     * @returns {Array} Available time slots
     */
    generateTimeSlots(hours = 4, intervalMinutes = 10) {
        const slots = [];
        const now = new Date();

        // Round up to the next interval
        const startTime = new Date(
            Math.ceil(now.getTime() / (intervalMinutes * 60000)) * (intervalMinutes * 60000)
        );

        // Add buffer for minimum prep time
        startTime.setMinutes(startTime.getMinutes() + 15);

        for (let i = 0; i < (hours * 60) / intervalMinutes; i++) {
            const slotStart = new Date(startTime.getTime() + i * intervalMinutes * 60000);
            const slotEnd = new Date(slotStart.getTime() + intervalMinutes * 60000);

            slots.push({
                start: slotStart,
                end: slotEnd,
                label: `${slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${slotEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
                rushIntensity: this.calculateRushIntensity(slotStart)
            });
        }

        return slots;
    }
}

module.exports = AIScheduler;
