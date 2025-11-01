import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventApi } from '../services/eventApi';
import { uploadApi } from '../services/uploadApi';
import ExhibitorModal from '../components/events/ExhibitorModal';
import { Calendar, MapPin, IndianRupee, Pencil, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg ${active ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
  >
    {children}
  </button>
);

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registrations');
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [exhibitors, setExhibitors] = useState([]);
  const [loadingExh, setLoadingExh] = useState(false);
  const [showExhibitorModal, setShowExhibitorModal] = useState(false);

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventApi.getEvent(eventId);
      setEvent(data.event || data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadRegistrations = useCallback(async () => {
    try {
      setLoadingRegs(true);
      const data = await eventApi.getEventRegistrations(eventId);
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load registrations');
    } finally {
      setLoadingRegs(false);
    }
  }, [eventId]);

  const loadExhibitors = useCallback(async () => {
    try {
      setLoadingExh(true);
      const data = await eventApi.listExhibitors(eventId);
      setExhibitors(data.exhibitors || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load exhibitors');
    } finally {
      setLoadingExh(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (activeTab === 'registrations') {
      loadRegistrations();
    } else if (activeTab === 'exhibitors') {
      loadExhibitors();
    }
  }, [activeTab, loadRegistrations, loadExhibitors]);

  const onAddExhibitor = async (payload) => {
    try {
      await eventApi.createExhibitor(eventId, payload);
      toast.success('Exhibitor added');
      setShowExhibitorModal(false);
      loadExhibitors();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add exhibitor');
    }
  };

  const onToggleAttendance = async (reg, nextValue) => {
    // Only allow toggling ON via QR check-in endpoint (idempotent)
    if (!nextValue) {
      toast.error('Un-check not supported');
      return;
    }
    if (reg.attendedAt) return; // already attended
    if (!reg.qrToken) {
      toast.error('QR token not available for this registration');
      return;
    }
    try {
      await eventApi.checkinByQr(reg.qrToken);
      setRegistrations(prev => prev.map(r => r.memberId === reg.memberId ? { ...r, attendedAt: new Date().toISOString() } : r));
      toast.success('Check-in successful');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to check-in');
    }
  };

  const imgUrl = useMemo(() => uploadApi.getImageUrl(event?.image || event?.imageURL), [event]);

  // Calculate total fees from registrations
  const totalFees = useMemo(() => {
    return registrations.reduce((sum, r) => sum + (r.amountPaid ?? 0), 0);
  }, [registrations]);

  // Format datetime
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    try {
      const dt = new Date(dateTimeStr);
      return dt.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
            <p className="text-gray-600">View registrations and exhibitors</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/events/${eventId}/edit`} className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <Link to="/events/new" className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add New
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          </div>
        ) : event ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              {imgUrl ? (
                <img src={imgUrl} alt={event.name || event.title} className="h-full w-full object-cover" />
              ) : (
                <Calendar className="h-12 w-12 text-primary-600" />
              )}
            </div>
            <div className="p-6 space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">{event.name || event.title}</h2>
              <p className="text-gray-700">{event.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" />
                  <div>
                    <div className="font-medium">From:</div>
                    <div>{formatDateTime(event.startDateTime || event.startDate)}</div>
                    {event.endDateTime || event.endDate ? (
                      <>
                        <div className="font-medium mt-1">To:</div>
                        <div>{formatDateTime(event.endDateTime || event.endDate)}</div>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center"><MapPin className="h-4 w-4 mr-2" />{event.address}{event.city ? `, ${event.city}` : ''}</div>
                <div className="flex items-center"><IndianRupee className="h-4 w-4 mr-2" />₹ {event.registrationFee ?? event.fee ?? 0}</div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <TabButton active={activeTab === 'registrations'} onClick={() => setActiveTab('registrations')}>Registrations</TabButton>
          <TabButton active={activeTab === 'exhibitors'} onClick={() => setActiveTab('exhibitors')}>Exhibitors</TabButton>
        </div>

        {/* Registrations */}
        {activeTab === 'registrations' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-gray-900">Registrations</h3>
                <span className="text-sm text-gray-600">({registrations.length} registered)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Fees Collected</p>
                  <p className="text-lg font-bold text-green-600">₹ {totalFees.toFixed(2)}</p>
                </div>
                <button onClick={loadRegistrations} className="text-sm text-primary-600 hover:underline">Refresh</button>
              </div>
            </div>
            <div className="p-6 overflow-x-auto">
              {loadingRegs ? (
                <div className="text-center text-gray-600">Loading...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrations.map((r, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm text-gray-900">{r.name || r.memberName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{r.phone}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">₹ {r.amountPaid ?? 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{r.registeredAt ? new Date(r.registeredAt).toLocaleString() : '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={!!r.attendedAt}
                              onChange={(e) => onToggleAttendance(r, e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            <span className="ml-3 text-sm text-gray-700">{r.attendedAt ? 'Checked-in' : 'Not attended'}</span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Exhibitors */}
        {activeTab === 'exhibitors' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Exhibitors</h3>
              <button onClick={() => setShowExhibitorModal(true)} className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Exhibitor
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              {loadingExh ? (
                <div className="text-center text-gray-600">Loading...</div>
              ) : exhibitors.length === 0 ? (
                <div className="text-center text-gray-600">No exhibitors yet</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exhibitors.map((ex) => (
                      <tr key={ex.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{ex.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {ex.businessCategory || 'Other'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{ex.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{ex.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        <ExhibitorModal
          isOpen={showExhibitorModal}
          onClose={() => setShowExhibitorModal(false)}
          onSubmit={onAddExhibitor}
        />
      </div>
    </Layout>
  );
};

export default EventDetails;


