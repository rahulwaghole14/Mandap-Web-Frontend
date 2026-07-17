document.addEventListener('DOMContentLoaded', () => {
    // Check authentication (requires admin/volunteer token)
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let html5QrCode = null;
    let isProcessing = false;
    let currentCameraId = null;
    let cameras = [];

    const overlay = document.getElementById('scan-overlay');
    const resultBanner = document.getElementById('result-banner');
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const resultDetails = document.getElementById('result-details');
    const scanNextBtn = document.getElementById('scan-next-btn');

    const manualModal = document.getElementById('manual-modal');
    const manualBtn = document.getElementById('manual-entry-btn');
    const closeManualBtn = document.getElementById('close-manual-modal');
    const submitManualCode = document.getElementById('submit-manual-code');
    const manualCodeInput = document.getElementById('manual-code-input');
    const cameraSwapBtn = document.getElementById('camera-swap-btn');

    // Initialize scanner
    const startScanner = async () => {
        try {
            cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
                // Prefer back camera
                currentCameraId = cameras[cameras.length - 1].id;
                
                html5QrCode = new Html5Qrcode("reader");
                await html5QrCode.start(
                    currentCameraId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    onScanSuccess,
                    onScanFailure
                );
            } else {
                showError("No cameras found on this device.");
            }
        } catch (err) {
            console.error("Scanner init error:", err);
            showError("Camera access denied or unavailable.");
        }
    };

    const stopScanner = async () => {
        if (html5QrCode && html5QrCode.isScanning) {
            try {
                await html5QrCode.stop();
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (isProcessing) return; // Prevent double scanning
        
        isProcessing = true;
        
        // Pause scanning visually
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.pause(true);
        }
        
        overlay.classList.remove('hidden');
        resultBanner.classList.add('hidden');
        
        await processTicket(decodedText);
    };

    const onScanFailure = (error) => {
        // Ignore constant scanning failures
    };

    const processTicket = async (qrRef) => {
        try {
            const response = await window.api.checkinByQr(qrRef);
            
            // Show Success
            showSuccess(response.message || "Checked In Successfully", response.data || response.registration || null);
            
        } catch (error) {
            // Show Error
            showError(error.message || "Invalid Ticket or Check-in Failed");
        } finally {
            overlay.classList.add('hidden');
            scanNextBtn.classList.remove('hidden');
        }
    };

    const showSuccess = (msg, data) => {
        resultBanner.className = 'w-full max-w-md mt-6 rounded-xl p-4 transform transition-all duration-300 bg-green-600 bg-opacity-20 border border-green-500 text-green-100';
        resultBanner.classList.remove('hidden');
        
        resultIcon.innerHTML = '<i data-lucide="check-circle-2" class="h-8 w-8 text-green-400"></i>';
        resultTitle.textContent = 'Success';
        resultTitle.className = 'text-lg font-bold text-green-400';
        resultMessage.textContent = msg;

        if (data) {
            const name = data.memberName || data.name || (data.member && data.member.name) || 'Member';
            resultDetails.innerHTML = `<p class="text-xs font-semibold text-green-200">Attendee: ${name}</p>`;
            resultDetails.classList.remove('hidden');
        } else {
            resultDetails.classList.add('hidden');
        }

        scanNextBtn.className = 'w-full mt-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600';
        if (window.lucide) lucide.createIcons();
    };

    const showError = (msg) => {
        resultBanner.className = 'w-full max-w-md mt-6 rounded-xl p-4 transform transition-all duration-300 bg-red-900 bg-opacity-40 border border-red-700 text-red-100';
        resultBanner.classList.remove('hidden');
        
        resultIcon.innerHTML = '<i data-lucide="alert-triangle" class="h-8 w-8 text-red-400"></i>';
        resultTitle.textContent = 'Check-In Failed';
        resultTitle.className = 'text-lg font-bold text-red-400';
        resultMessage.textContent = msg;
        resultDetails.classList.add('hidden');

        scanNextBtn.className = 'w-full mt-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700';
        if (window.lucide) lucide.createIcons();
    };

    scanNextBtn.addEventListener('click', () => {
        resultBanner.classList.add('hidden');
        scanNextBtn.classList.add('hidden');
        isProcessing = false;
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.resume();
        }
    });

    // Camera Switch Logic
    cameraSwapBtn.addEventListener('click', async () => {
        if (cameras.length > 1 && html5QrCode && html5QrCode.isScanning) {
            const newCameraId = cameras.find(c => c.id !== currentCameraId)?.id;
            if (newCameraId) {
                await stopScanner();
                currentCameraId = newCameraId;
                await html5QrCode.start(currentCameraId, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, onScanFailure);
            }
        }
    });

    // Manual Entry Logic
    manualBtn.addEventListener('click', () => {
        manualModal.classList.remove('hidden');
        manualCodeInput.focus();
    });

    closeManualBtn.addEventListener('click', () => {
        manualModal.classList.add('hidden');
    });

    submitManualCode.addEventListener('click', async () => {
        const code = manualCodeInput.value.trim();
        if (!code) return;
        
        manualModal.classList.add('hidden');
        manualCodeInput.value = '';
        
        if (isProcessing) return;
        isProcessing = true;
        
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.pause(true);
        }
        
        overlay.classList.remove('hidden');
        resultBanner.classList.add('hidden');
        
        await processTicket(code);
    });

    // Start
    startScanner();
});
