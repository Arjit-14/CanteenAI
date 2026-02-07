const QRCode = require('qrcode');

/**
 * QR Code Service
 * Generates and validates QR codes for orders
 */

class QRService {
    /**
     * Generate QR code as data URL
     * @param {string} token - The order token
     * @returns {Promise<string>} QR code data URL
     */
    static async generateQR(token) {
        try {
            const qrDataUrl = await QRCode.toDataURL(token, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#1a1a2e',
                    light: '#ffffff'
                },
                width: 256
            });
            return qrDataUrl;
        } catch (error) {
            console.error('QR Generation Error:', error);
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Generate QR code as SVG string
     * @param {string} token - The order token
     * @returns {Promise<string>} QR code SVG
     */
    static async generateQRSvg(token) {
        try {
            const svgString = await QRCode.toString(token, {
                type: 'svg',
                errorCorrectionLevel: 'M',
                margin: 1,
                color: {
                    dark: '#1a1a2e',
                    light: '#ffffff'
                }
            });
            return svgString;
        } catch (error) {
            console.error('QR Generation Error:', error);
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Validate token format
     * @param {string} token - Token to validate
     * @returns {Object} { valid: boolean, type: 'order' | 'claim' }
     */
    static validateToken(token) {
        if (!token || typeof token !== 'string') {
            return { valid: false, type: null };
        }

        if (token.startsWith('ORD-')) {
            return { valid: true, type: 'order' };
        }

        if (token.startsWith('CLM-')) {
            return { valid: true, type: 'claim' };
        }

        return { valid: false, type: null };
    }
}

module.exports = QRService;
