document.addEventListener('DOMContentLoaded', () => {
    // State
    let step = 1;
    let mobileNumber = '';
    let otp = '';
    let requestId = '';
    let loading = false;
    let resendTimer = 0;
    let deletionInfo = null;
    let isExistingRequest = false;
    let cancelledAt = null;
    let timerInterval = null;

    // Elements
    const elements = {
        steps: [
            document.getElementById('step-1'),
            document.getElementById('step-2'),
            document.getElementById('step-3'),
            document.getElementById('step-4')
        ],
        mobileForm: document.getElementById('mobile-form'),
        mobileInput: document.getElementById('mobileNumber'),
        sendOtpBtn: document.getElementById('send-otp-btn'),
        otpForm: document.getElementById('otp-form'),
        otpInput: document.getElementById('otp'),
        verifyOtpBtn: document.getElementById('verify-otp-btn'),
        backToStep1Btn: document.getElementById('back-to-step1-btn'),
        resendOtpBtn: document.getElementById('resend-otp-btn'),
        cancelDeletionBtn: document.getElementById('cancel-deletion-btn'),
        
        displayMobileLast4: document.getElementById('display-mobile-last4'),
        confirmationTitle: document.getElementById('confirmation-title'),
        confirmationMsg: document.getElementById('confirmation-msg'),
        detailMobile: document.getElementById('detail-mobile'),
        detailDate: document.getElementById('detail-date'),
        infoDate: document.getElementById('info-date'),
        cancelMobile: document.getElementById('cancel-mobile'),
        cancelTime: document.getElementById('cancel-time'),
    };

    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        
        toast.className = `transform transition-all duration-300 translate-x-full opacity-0 flex items-center w-full max-w-xs p-4 space-x-3 text-white ${bgColor} rounded-lg shadow`;
        
        toast.innerHTML = `
            <div class="text-sm font-normal">${message}</div>
            <button class="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-white p-1.5 inline-flex h-8 w-8 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
        `;
        
        container.appendChild(toast);
        lucide.createIcons();
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('translate-x-0', 'opacity-100');
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const setStep = (newStep) => {
        step = newStep;
        elements.steps.forEach((el, index) => {
            if (index + 1 === step) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    };

    const setLoading = (btnElement, isLoading, defaultText) => {
        loading = isLoading;
        const textSpan = btnElement.querySelector('.btn-text');
        const loaderDiv = btnElement.querySelector('.btn-loader');
        
        btnElement.disabled = isLoading;
        if (isLoading) {
            textSpan.textContent = isLoading === true ? 'Processing...' : isLoading;
            loaderDiv.classList.remove('hidden');
        } else {
            textSpan.textContent = defaultText;
            loaderDiv.classList.add('hidden');
        }
    };

    const formatMobileNumber = (number) => {
        if (number.length <= 3) return number;
        return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    };

    const formatDeletionDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const updateResendTimer = () => {
        const btn = elements.resendOtpBtn;
        const textSpan = btn.querySelector('.btn-text');
        
        if (resendTimer > 0) {
            const minutes = Math.floor(resendTimer / 60);
            const seconds = (resendTimer % 60).toString().padStart(2, '0');
            btn.disabled = true;
            textSpan.textContent = `Resend OTP in ${minutes}:${seconds}`;
        } else {
            btn.disabled = false;
            textSpan.textContent = 'Resend OTP';
            clearInterval(timerInterval);
        }
    };

    // Event Listeners
    elements.mobileInput.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\\D/g, '').slice(0, 10);
        e.target.value = val;
        mobileNumber = val;
        elements.sendOtpBtn.disabled = val.length !== 10;
    });

    elements.otpInput.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\\D/g, '').slice(0, 6);
        e.target.value = val;
        otp = val;
        elements.verifyOtpBtn.disabled = val.length !== 6;
    });

    elements.mobileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (mobileNumber.length !== 10) return;
        
        setLoading(elements.sendOtpBtn, 'Sending OTP...', 'Send OTP');

        try {
            const response = await fetch('http://localhost:3001/api/account/request-deletion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mobileNumber }),
            });

            const data = await response.json();

            if (data.success) {
                requestId = data.requestId;
                isExistingRequest = data.existingRequest || false;
                
                elements.displayMobileLast4.textContent = mobileNumber.slice(-4);
                setStep(2);
                
                resendTimer = 600; // 10 minutes
                updateResendTimer();
                timerInterval = setInterval(() => {
                    resendTimer--;
                    updateResendTimer();
                }, 1000);
                
                showToast('OTP sent to your WhatsApp number');
            } else {
                showToast(data.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            setLoading(elements.sendOtpBtn, false, 'Send OTP');
        }
    });

    elements.otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (otp.length !== 6) return;
        
        setLoading(elements.verifyOtpBtn, 'Verifying...', 'Verify OTP');

        try {
            const response = await fetch('http://localhost:3001/api/account/confirm-deletion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ requestId, otp }),
            });

            const data = await response.json();

            if (data.success) {
                deletionInfo = data;
                
                elements.detailMobile.textContent = formatMobileNumber(mobileNumber);
                elements.detailDate.textContent = formatDeletionDate(deletionInfo.deletionScheduledAt);
                elements.infoDate.textContent = formatDeletionDate(deletionInfo.deletionScheduledAt);
                
                if (isExistingRequest) {
                    elements.confirmationTitle.textContent = 'Existing Deletion Request Found';
                    elements.confirmationMsg.textContent = 'You already have a deletion request scheduled. You can view details or cancel it below.';
                    showToast('Authenticated! You can view or cancel your existing deletion request');
                } else {
                    elements.confirmationTitle.textContent = 'Deletion Request Confirmed';
                    elements.confirmationMsg.textContent = 'Your account deletion request has been confirmed and scheduled.';
                    showToast('Account deletion request confirmed');
                }
                
                setStep(3);
            } else {
                showToast(data.message || 'Invalid OTP', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            setLoading(elements.verifyOtpBtn, false, 'Verify OTP');
        }
    });

    elements.resendOtpBtn.addEventListener('click', async () => {
        if (resendTimer > 0) return;
        
        setLoading(elements.resendOtpBtn, 'Sending...', 'Resend OTP');

        try {
            const response = await fetch('http://localhost:3001/api/account/request-deletion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mobileNumber }),
            });

            const data = await response.json();

            if (data.success) {
                requestId = data.requestId;
                resendTimer = 600;
                updateResendTimer();
                clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                    resendTimer--;
                    updateResendTimer();
                }, 1000);
                showToast('OTP resent to your WhatsApp number');
            } else {
                showToast(data.message || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            setLoading(elements.resendOtpBtn, false, 'Resend OTP');
        }
    });

    elements.backToStep1Btn.addEventListener('click', () => {
        setStep(1);
    });

    elements.cancelDeletionBtn.addEventListener('click', async () => {
        if (!requestId) return;
        
        setLoading(elements.cancelDeletionBtn, 'Cancelling...', 'Cancel Deletion');

        try {
            const response = await fetch('http://localhost:3001/api/account/cancel-deletion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ requestId }),
            });

            const data = await response.json();

            if (data.success) {
                showToast('Account deletion request cancelled');
                cancelledAt = new Date();
                
                elements.cancelMobile.textContent = formatMobileNumber(mobileNumber);
                elements.cancelTime.textContent = cancelledAt.toLocaleString();
                
                setStep(4);
            } else {
                showToast(data.message || 'Failed to cancel deletion', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            setLoading(elements.cancelDeletionBtn, false, 'Cancel Deletion');
        }
    });
});
