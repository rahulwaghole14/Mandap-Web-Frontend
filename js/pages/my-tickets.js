document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (user.name) {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) userNameEl.textContent = user.name;
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', window.api.logout);
    }

    const ticketsList = document.getElementById('tickets-list');
    const loadingView = document.getElementById('tickets-loading');
    const noTicketsView = document.getElementById('no-tickets');

    const modalOverlay = document.getElementById('ticket-modal');
    const closeModalBtn = document.getElementById('close-ticket-modal');
    
    closeModalBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    });
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });

    try {
        const response = await window.api.getMyRegistrations();
        const registrations = response.data || [];

        loadingView.classList.add('hidden');

        if (registrations.length === 0) {
            noTicketsView.classList.remove('hidden');
        } else {
            ticketsList.classList.remove('hidden');
            
            registrations.forEach(reg => {
                const eventName = reg.event?.title || reg.event?.name || 'Event Ticket';
                const dateStr = reg.event?.start_date ? new Date(reg.event.start_date).toLocaleDateString() : 'Date TBD';
                const locationStr = reg.event?.city || 'Location TBD';
                const status = reg.attendance_status === 'Attended' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800';
                const statusText = reg.attendance_status === 'Attended' ? 'Checked In' : 'Valid Pass';
                
                const qrRef = reg.qr_code_ref || reg.qrToken || `EVT-${reg.event_id}-MEM-${reg.member_id}`;

                const card = document.createElement('div');
                card.className = 'bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer';
                card.innerHTML = `
                    <div class="h-2 bg-primary-600"></div>
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="font-bold text-gray-900 line-clamp-1">${eventName}</h3>
                                <p class="text-sm text-gray-500 flex items-center mt-1">
                                    <i data-lucide="calendar" class="h-3 w-3 mr-1"></i> ${dateStr}
                                </p>
                            </div>
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status}">
                                ${statusText}
                            </span>
                        </div>
                        
                        <div class="flex justify-center my-4">
                            <div class="ticket-qr-preview w-32 h-32 bg-gray-50 flex items-center justify-center p-2 rounded-lg" data-ref="${qrRef}"></div>
                        </div>
                        
                        <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                            <span class="text-gray-500">Ref: ${qrRef.split('-').pop()}</span>
                            <span class="text-primary-600 font-medium group-hover:text-primary-700">View Pass &rarr;</span>
                        </div>
                    </div>
                `;

                // Render thumbnail QR
                const previewContainer = card.querySelector('.ticket-qr-preview');
                if (window.QRCode) {
                    new QRCode(previewContainer, {
                        text: String(qrRef),
                        width: 112,
                        height: 112,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.M
                    });
                }

                // Click to open modal
                card.addEventListener('click', () => {
                    document.getElementById('ticket-event-name').textContent = eventName;
                    document.getElementById('ticket-member-name').textContent = user.name || 'Member';
                    document.getElementById('ticket-ref').textContent = `Ref: ${qrRef}`;
                    
                    const modalQrContainer = document.getElementById('modal-qr-container');
                    modalQrContainer.innerHTML = '';
                    if (window.QRCode) {
                        new QRCode(modalQrContainer, {
                            text: String(qrRef),
                            width: 176,
                            height: 176,
                            colorDark: "#000000",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    }

                    modalOverlay.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                    
                    window.currentTicketData = {
                        eventName: eventName,
                        eventDate: dateStr,
                        eventVenue: locationStr,
                        memberName: user.name || 'Member',
                        registrationId: reg.id || `#${Math.floor(Math.random() * 10000)}`,
                        amount: parseFloat(reg.amountPaid || reg.registration_fee) || 0,
                        paymentMethod: reg.payment_method || 'Online',
                        paymentStatus: reg.payment_status || 'Paid',
                        qrRef: qrRef,
                        qrUrl: reg.qr_code_url || reg.qr_code_data_url || null
                    };
                });

                ticketsList.appendChild(card);
            });
            lucide.createIcons();
        }

    } catch (err) {
        console.error('Failed to load tickets:', err);
        loadingView.classList.add('hidden');
        noTicketsView.classList.remove('hidden');
        noTicketsView.querySelector('h3').textContent = 'Error Loading Tickets';
        noTicketsView.querySelector('p').textContent = err.message || 'Please try again later.';
    }

    // Global download button handler
    const downloadPassBtn = document.getElementById('download-pass-btn');
    if (downloadPassBtn) {
        let isDownloading = false;
        downloadPassBtn.addEventListener('click', async () => {
            if (isDownloading || !window.currentTicketData) return;
            
            isDownloading = true;
            downloadPassBtn.classList.add('opacity-75', 'cursor-not-allowed');
            const originalHtml = downloadPassBtn.innerHTML;
            downloadPassBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 mr-2 animate-spin"></i> Downloading...';
            if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', nodes: [downloadPassBtn] });

            try {
                let pdfBlob;
                if (window.api.generateProfessionalTicketPdf) {
                    pdfBlob = await window.api.generateProfessionalTicketPdf(window.currentTicketData);
                } else {
                    pdfBlob = await window.api.generatePdfFromElement('ticket-modal');
                }
                
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `mandapam-visitor-pass-${window.currentTicketData.registrationId}.pdf`;
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            } catch (error) {
                console.error('Download error:', error);
                alert('Could not download the pass. Please try again.');
            } finally {
                isDownloading = false;
                downloadPassBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                downloadPassBtn.innerHTML = originalHtml;
                if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', nodes: [downloadPassBtn] });
            }
        });
    }
});
