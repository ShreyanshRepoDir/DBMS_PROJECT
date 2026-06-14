import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Marketplace = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const fetchMarketplace = async () => {
    try {
      const res = await api.get('/transfers/marketplace');
      setTransfers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTransfer = async (transferId) => {
    if (!user) {
      toast.error('Please login to request a room');
      return;
    }
    try {
      await api.post('/transfers/request', { transfer_id: transferId });
      toast.success('Transfer requested successfully! Wait for admin approval.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error requesting transfer');
    }
  };

  if (loading) return <div className="container mt-4">Loading Marketplace...</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Room Transfer Marketplace</h2>
      <p className="text-muted">Take over verified bookings from other students.</p>

      {transfers.length === 0 ? (
        <div className="alert alert-info">No rooms are currently available for transfer.</div>
      ) : (
        <div className="row">
          {transfers.map(t => (
            <div className="col-md-6 mb-4" key={t.id}>
              <div className="card h-100 shadow-sm border-primary">
                <div className="card-body">
                  <h5 className="card-title text-primary">{t.property_title}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">{t.city}</h6>
                  <p className="mb-1"><strong>Current Tenant:</strong> {t.current_tenant}</p>
                  <p className="mb-1"><strong>Reason for Transfer:</strong> {t.reason}</p>
                  <p className="mb-3">
                    <strong>Booking Period:</strong> {new Date(t.start_date).toLocaleDateString()} to {new Date(t.end_date).toLocaleDateString()}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="h5 mb-0 text-success">₹{t.price}</span>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => handleRequestTransfer(t.id)}
                    >
                      Request Room
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
