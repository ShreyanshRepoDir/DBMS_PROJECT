import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const AddProperty = () => {
  const [formData, setFormData] = useState({
    title: '', description: '', city: '', price: '', type: 'apartment'
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/properties', formData);
      toast.success('Property added successfully');
      navigate('/agent/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding property');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">
            <h2 className="mb-4">Add New Property</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Title</label>
                <input type="text" className="form-control" required 
                       value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label>City</label>
                  <input type="text" className="form-control" required 
                         value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label>Price</label>
                  <input type="number" className="form-control" required min="1"
                         value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
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
              <button type="submit" className="btn btn-primary">Add Property</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;
