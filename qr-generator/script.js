// QR Code Generator Application
class QRCodeGenerator {
    constructor() {
        this.currentQRCode = null;
        this.currentCanvas = null;
        this.logoImage = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.showInputForm('url');
    }

    bindEvents() {
        // Input type selector
        document.getElementById('input-type').addEventListener('change', (e) => {
            this.showInputForm(e.target.value);
        });

        // Generate button
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateQRCode();
        });

        // Real-time input changes
        this.bindInputEvents();

        // Customization controls
        document.getElementById('fg-color').addEventListener('change', () => this.updateQRCode());
        document.getElementById('bg-color').addEventListener('change', () => this.updateQRCode());
        document.getElementById('qr-size').addEventListener('change', () => this.updateQRCode());
        document.getElementById('logo-upload').addEventListener('change', (e) => this.handleLogoUpload(e));

        // Download buttons
        document.getElementById('download-png').addEventListener('click', () => this.downloadQRCode('png'));
        document.getElementById('download-jpg').addEventListener('click', () => this.downloadQRCode('jpg'));
        document.getElementById('download-svg').addEventListener('click', () => this.downloadQRCode('svg'));
        document.getElementById('download-print').addEventListener('click', () => this.downloadQRCode('print'));

        // Share buttons
        document.getElementById('copy-btn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('share-btn').addEventListener('click', () => this.shareQRCode());
    }

    bindInputEvents() {
        // URL input
        document.getElementById('url-input').addEventListener('input', () => this.updateQRCode());
        
        // Text input
        document.getElementById('text-input').addEventListener('input', () => this.updateQRCode());
        
        // Image input
        document.getElementById('image-input').addEventListener('input', () => this.updateQRCode());
        
        // vCard inputs
        ['vcard-name', 'vcard-phone', 'vcard-email', 'vcard-organization', 'vcard-address'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateQRCode());
        });
        
        // WiFi inputs
        ['wifi-ssid', 'wifi-password', 'wifi-security', 'wifi-hidden'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateQRCode());
        });
    }

    showInputForm(type) {
        // Hide all forms
        document.querySelectorAll('.input-form').forEach(form => {
            form.style.display = 'none';
        });
        
        // Show selected form
        document.getElementById(`${type}-form`).style.display = 'block';
        
        // Update QR code if there's content
        this.updateQRCode();
    }

    getInputData() {
        const inputType = document.getElementById('input-type').value;
        let data = '';

        switch (inputType) {
            case 'url':
                data = document.getElementById('url-input').value.trim();
                break;
                
            case 'text':
                data = document.getElementById('text-input').value.trim();
                break;
                
            case 'image':
                data = document.getElementById('image-input').value.trim();
                break;
                
            case 'vcard':
                data = this.generateVCard();
                break;
                
            case 'wifi':
                data = this.generateWiFiString();
                break;
        }

        return data;
    }

    generateVCard() {
        const name = document.getElementById('vcard-name').value.trim();
        const phone = document.getElementById('vcard-phone').value.trim();
        const email = document.getElementById('vcard-email').value.trim();
        const org = document.getElementById('vcard-organization').value.trim();
        const address = document.getElementById('vcard-address').value.trim();

        if (!name && !phone && !email) return '';

        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        if (name) vcard += `FN:${name}\n`;
        if (phone) vcard += `TEL:${phone}\n`;
        if (email) vcard += `EMAIL:${email}\n`;
        if (org) vcard += `ORG:${org}\n`;
        if (address) vcard += `ADR:;;${address};;;;\n`;
        vcard += 'END:VCARD';

        return vcard;
    }

    generateWiFiString() {
        const ssid = document.getElementById('wifi-ssid').value.trim();
        const password = document.getElementById('wifi-password').value.trim();
        const security = document.getElementById('wifi-security').value;
        const hidden = document.getElementById('wifi-hidden').checked;

        if (!ssid) return '';

        let wifiString = `WIFI:T:${security};S:${ssid};`;
        if (password && security !== 'nopass') {
            wifiString += `P:${password};`;
        }
        if (hidden) {
            wifiString += 'H:true;';
        }
        wifiString += ';';

        return wifiString;
    }

    async generateQRCode() {
        const data = this.getInputData();
        if (!data) {
            this.showPlaceholder();
            return;
        }

        try {
            await this.createQRCode(data);
            this.enableDownloadButtons();
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.showError('Failed to generate QR code');
        }
    }

    async updateQRCode() {
        const data = this.getInputData();
        if (!data) {
            this.showPlaceholder();
            this.disableDownloadButtons();
            return;
        }

        try {
            await this.createQRCode(data);
            this.enableDownloadButtons();
        } catch (error) {
            console.error('Error updating QR code:', error);
        }
    }

    async createQRCode(data) {
        const canvas = document.createElement('canvas');
        const size = parseInt(document.getElementById('qr-size').value);
        const fgColor = document.getElementById('fg-color').value;
        const bgColor = document.getElementById('bg-color').value;

        const options = {
            width: size,
            height: size,
            color: {
                dark: fgColor,
                light: bgColor
            },
            margin: 2,
            errorCorrectionLevel: 'M'
        };

        await QRCode.toCanvas(canvas, data, options);
        
        // Add logo if uploaded
        if (this.logoImage) {
            await this.addLogoToCanvas(canvas);
        }

        this.currentCanvas = canvas;
        this.displayQRCode(canvas);
    }

    async addLogoToCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const logoSize = Math.min(canvas.width, canvas.height) * 0.2; // 20% of QR code size
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;

        // Create a white background for the logo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);

        // Draw the logo
        ctx.drawImage(this.logoImage, x, y, logoSize, logoSize);
    }

    displayQRCode(canvas) {
        const preview = document.getElementById('qr-preview');
        preview.innerHTML = '';
        preview.appendChild(canvas);
    }

    showPlaceholder() {
        const preview = document.getElementById('qr-preview');
        preview.innerHTML = '<div class="placeholder">QR Code will appear here</div>';
    }

    showError(message) {
        const preview = document.getElementById('qr-preview');
        preview.innerHTML = `<div class="placeholder" style="color: #dc3545;">${message}</div>`;
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            this.logoImage = null;
            this.updateQRCode();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.logoImage = img;
                this.updateQRCode();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    enableDownloadButtons() {
        document.querySelectorAll('.download-btn, .share-btn').forEach(btn => {
            btn.disabled = false;
        });
    }

    disableDownloadButtons() {
        document.querySelectorAll('.download-btn, .share-btn').forEach(btn => {
            btn.disabled = true;
        });
    }

    downloadQRCode(format) {
        if (!this.currentCanvas) return;

        const canvas = this.currentCanvas;
        let link = document.createElement('a');
        
        switch (format) {
            case 'png':
                link.download = 'qrcode.png';
                link.href = canvas.toDataURL('image/png');
                break;
                
            case 'jpg':
                link.download = 'qrcode.jpg';
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                break;
                
            case 'svg':
                this.downloadSVG();
                return;
                
            case 'print':
                this.downloadHighRes();
                return;
        }
        
        link.click();
    }

    async downloadSVG() {
        const data = this.getInputData();
        if (!data) return;

        try {
            const size = parseInt(document.getElementById('qr-size').value);
            const fgColor = document.getElementById('fg-color').value;
            const bgColor = document.getElementById('bg-color').value;

            const svgString = await QRCode.toString(data, {
                type: 'svg',
                width: size,
                color: {
                    dark: fgColor,
                    light: bgColor
                },
                margin: 2
            });

            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.download = 'qrcode.svg';
            link.href = url;
            link.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating SVG:', error);
        }
    }

    async downloadHighRes() {
        const data = this.getInputData();
        if (!data) return;

        try {
            const canvas = document.createElement('canvas');
            const size = 1000; // High resolution for print
            const fgColor = document.getElementById('fg-color').value;
            const bgColor = document.getElementById('bg-color').value;

            const options = {
                width: size,
                height: size,
                color: {
                    dark: fgColor,
                    light: bgColor
                },
                margin: 4,
                errorCorrectionLevel: 'H' // High error correction for print
            };

            await QRCode.toCanvas(canvas, data, options);
            
            if (this.logoImage) {
                await this.addLogoToCanvas(canvas);
            }

            const link = document.createElement('a');
            link.download = 'qrcode-print.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error generating high-res QR code:', error);
        }
    }

    async copyToClipboard() {
        if (!this.currentCanvas) return;

        try {
            this.currentCanvas.toBlob(async (blob) => {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                
                // Show feedback
                const btn = document.getElementById('copy-btn');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                btn.style.background = '#28a745';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#17a2b8';
                }, 2000);
            });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            // Fallback: copy data URL
            try {
                await navigator.clipboard.writeText(this.currentCanvas.toDataURL());
            } catch (fallbackError) {
                console.error('Fallback copy failed:', fallbackError);
            }
        }
    }

    async shareQRCode() {
        if (!this.currentCanvas || !navigator.share) {
            // Fallback for browsers that don't support Web Share API
            this.copyToClipboard();
            return;
        }

        try {
            this.currentCanvas.toBlob(async (blob) => {
                const file = new File([blob], 'qrcode.png', { type: 'image/png' });
                
                await navigator.share({
                    title: 'QR Code',
                    text: 'Check out this QR code!',
                    files: [file]
                });
            });
        } catch (error) {
            console.error('Error sharing QR code:', error);
            // Fallback to copy
            this.copyToClipboard();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QRCodeGenerator();
});

// Add some utility functions for enhanced UX
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add loading states
function addLoadingState(element) {
    element.classList.add('loading');
}

function removeLoadingState(element) {
    element.classList.remove('loading');
}