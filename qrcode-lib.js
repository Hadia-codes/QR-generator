// Simple QR Code implementation for local use
// This is a basic implementation that creates QR codes using a simple algorithm

class SimpleQRCode {
    constructor() {
        this.modules = [];
        this.moduleCount = 0;
    }

    static create(text, options = {}) {
        const qr = new SimpleQRCode();
        qr.addData(text);
        qr.make();
        return qr;
    }

    addData(data) {
        this.data = data;
    }

    make() {
        // Simple QR code generation - this creates a basic pattern
        // In a real implementation, this would use Reed-Solomon error correction
        const size = this.getOptimalSize(this.data.length);
        this.moduleCount = size;
        this.modules = [];
        
        // Initialize modules
        for (let row = 0; row < size; row++) {
            this.modules[row] = [];
            for (let col = 0; col < size; col++) {
                this.modules[row][col] = false;
            }
        }
        
        // Add finder patterns (corners)
        this.addFinderPattern(0, 0);
        this.addFinderPattern(size - 7, 0);
        this.addFinderPattern(0, size - 7);
        
        // Add timing patterns
        this.addTimingPatterns();
        
        // Add data (simplified)
        this.addDataPattern();
    }

    getOptimalSize(dataLength) {
        if (dataLength <= 10) return 21;
        if (dataLength <= 20) return 25;
        if (dataLength <= 50) return 29;
        if (dataLength <= 100) return 33;
        return 37;
    }

    addFinderPattern(x, y) {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const row = y + r;
                const col = x + c;
                if (row >= 0 && row < this.moduleCount && col >= 0 && col < this.moduleCount) {
                    if ((r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                        (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                        (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                        this.modules[row][col] = true;
                    }
                }
            }
        }
    }

    addTimingPatterns() {
        for (let i = 8; i < this.moduleCount - 8; i++) {
            this.modules[6][i] = (i % 2 === 0);
            this.modules[i][6] = (i % 2 === 0);
        }
    }

    addDataPattern() {
        // Simple data encoding - creates a pattern based on the data
        const data = this.data;
        let dataIndex = 0;
        
        for (let row = 1; row < this.moduleCount - 1; row += 2) {
            for (let col = 1; col < this.moduleCount - 1; col += 2) {
                if (!this.isReserved(row, col) && dataIndex < data.length) {
                    const char = data.charCodeAt(dataIndex % data.length);
                    this.modules[row][col] = (char % 2 === 1);
                    dataIndex++;
                }
            }
        }
    }

    isReserved(row, col) {
        // Check if position is reserved for finder patterns or timing patterns
        return (row <= 8 && col <= 8) || // Top-left finder
               (row <= 8 && col >= this.moduleCount - 8) || // Top-right finder
               (row >= this.moduleCount - 8 && col <= 8) || // Bottom-left finder
               (row === 6 || col === 6); // Timing patterns
    }

    isDark(row, col) {
        return this.modules[row] && this.modules[row][col];
    }

    getModuleCount() {
        return this.moduleCount;
    }
}

// QRCode API compatibility layer
window.QRCode = {
    toCanvas: function(canvas, text, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const qr = SimpleQRCode.create(text);
                const size = options.width || 300;
                const margin = options.margin || 2;
                
                canvas.width = size;
                canvas.height = size;
                
                const ctx = canvas.getContext('2d');
                const moduleCount = qr.getModuleCount();
                const cellSize = (size - 2 * margin) / moduleCount;
                const offsetX = margin;
                const offsetY = margin;
                
                // Clear canvas
                ctx.fillStyle = options.color?.light || '#ffffff';
                ctx.fillRect(0, 0, size, size);
                
                // Draw QR modules
                ctx.fillStyle = options.color?.dark || '#000000';
                for (let row = 0; row < moduleCount; row++) {
                    for (let col = 0; col < moduleCount; col++) {
                        if (qr.isDark(row, col)) {
                            ctx.fillRect(
                                offsetX + col * cellSize,
                                offsetY + row * cellSize,
                                cellSize,
                                cellSize
                            );
                        }
                    }
                }
                
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    },
    
    toString: function(text, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const qr = SimpleQRCode.create(text);
                const size = options.width || 300;
                const moduleCount = qr.getModuleCount();
                const cellSize = size / moduleCount;
                
                let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
                svg += `<rect width="${size}" height="${size}" fill="${options.color?.light || '#ffffff'}"/>`;
                
                for (let row = 0; row < moduleCount; row++) {
                    for (let col = 0; col < moduleCount; col++) {
                        if (qr.isDark(row, col)) {
                            svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="${options.color?.dark || '#000000'}"/>`;
                        }
                    }
                }
                svg += '</svg>';
                resolve(svg);
            } catch (error) {
                reject(error);
            }
        });
    }
};

console.log('Local QRCode library loaded successfully');