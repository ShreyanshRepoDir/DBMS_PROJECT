import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferReason, setTransferReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleListForTransfer = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      await api.post('/transfers/list', {
        booking_id: selectedBooking.id,
        reason: transferReason
      });
      toast.success('Booking successfully listed on the Transfer Marketplace!');
      setTransferReason('');
      setSelectedBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error listing transfer');
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;

  return (
    <div className="container mt-4">
      <h2>My Bookings</h2>
      {bookings.length === 0 ? (
        <p>You have no bookings.</p>
      ) : (
        <div className="row">
          {bookings.map(b => (
            <div className="col-md-6 mb-4" key={b.id}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Booking #{b.id}</h5>
                  <p><strong>Property ID:</strong> {b.property_id}</p>
                  <p><strong>Status:</strong> <span className={`badge bg-${b.status === 'confirmed' ? 'success' : 'secondary'}`}>{b.status}</span></p>
                  <p><strong>From:</strong> {new Date(b.start_date).toLocaleDateString()} <strong>To:</strong> {new Date(b.end_date).toLocaleDateString()}</p>
                  
                  {b.status === 'confirmed' && (
                    <button 
                      className="btn btn-warning mt-2" 
                      onClick={() => setSelectedBooking(b)}
                    >
                      List for Room Transfer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBooking && (
        <div className="card mt-4 border-warning shadow">
          <div className="card-body">
            <h5 className="card-title text-warning">List Booking #{selectedBooking.id} for Transfer</h5>
            <form onSubmit={handleListForTransfer}>
              <div className="mb-3">
                <label>Reason for Transfer (e.g. Internship, Family Issue)</label>
                <textarea 
                  className="form-control" 
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-warning">Confirm Listing</button>
              <button type="button" className="btn btn-secondary ms-2" onClick={() => setSelectedBooking(null)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
