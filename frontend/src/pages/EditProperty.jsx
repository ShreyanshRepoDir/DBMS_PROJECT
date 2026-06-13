import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const EditProperty = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '', description: '', city: '', price: '', type: 'apartment', status: 'available'
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        setFormData({
          title: res.data.title,
          description: res.data.description,
          city: res.data.city,
          price: res.data.price,
          type: res.data.type,
          status: res.data.status
        });
      } catch (err) {
        toast.error('Failed to load property');
        navigate('/agent/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/properties/${id}`, formData);
      toast.success('Property updated successfully');
      navigate(-1); // go back
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating property');
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">
            <h2 className="mb-4">Edit Property</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Title</label>
                <input type="text" className="form-control" required 
                       value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label>City</label>
                  <input type="text" className="form-control" required 
                         value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label>Price</label>
                  <input type="number" className="form-control" required min="1"
                         value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label>Status</label>
                  <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label>Type</label>
                <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div className="mb-4">
                <label>Description</label>
                <textarea className="form-control" rows="4" 
                          value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="d-flex justify-content-between">
                 <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                 <button type="submit" className="btn btn-primary">Update Property</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProperty;
