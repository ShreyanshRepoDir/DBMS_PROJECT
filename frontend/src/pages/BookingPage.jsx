import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const BookingPage = () => {
  const { id } = useParams(); // property ID
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [dates, setDates] = useState({ start_date: '', end_date: '' });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        setProperty(res.data);
      } catch (err) {
        toast.error('Failed to load property');
        navigate('/properties');
      }
    };
    fetchProperty();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/bookings', {
        property_id: id,
        start_date: dates.start_date,
        end_date: dates.end_date
      });
      toast.success('Booking initiated! Proceed to payment.');
      navigate(`/payment/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating booking');
    }
  };

  if (!property) return <div>Loading...</div>;

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-md-6">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h2 className="mb-4">Book Property</h2>
            <h5>{property.title}</h5>
            <p className="text-muted">{property.city}</p>
            <hr />
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Start Date</label>
                <input type="date" className="form-control" required
                       value={dates.start_date} onChange={e => setDates({...dates, start_date: e.target.value})} />
              </div>
              <div className="mb-4">
                <label>End Date</label>
                <input type="date" className="form-control" required
                       value={dates.end_date} onChange={e => setDates({...dates, end_date: e.target.value})} />
              </div>
              <div className="alert alert-info">
                Total Price: <strong>${property.price}</strong> (Fixed prototype price)
              </div>
              <button type="submit" className="btn btn-primary w-100">Confirm Dates & Proceed</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
