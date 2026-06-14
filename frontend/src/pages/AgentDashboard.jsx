import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const AgentDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties/agent/me');
      setProperties(res.data);
    } catch(e) {
      toast.error("Failed to load properties");
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/transfers/requests/pending');
      setPendingRequests(res.data);
    } catch (e) {
      toast.error("Failed to load transfer requests");
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    await Promise.all([fetchProperties(), fetchPendingRequests()]);
    setLoading(false);
  };

  useEffect(() => {
      loadDashboard();
  }, []);

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.delete(`/properties/${id}`);
        toast.success("Property deleted");
        fetchProperties(); // refresh list
      } catch(e) {
        toast.error("Failed to delete property");
      }
    }
  };

  const handleApproveTransfer = async (requestId) => {
    if(window.confirm('Are you sure you want to approve this transfer request? The booking will be reassigned.')) {
      try {
        await api.post('/transfers/approve', { request_id: requestId });
        toast.success("Transfer approved successfully!");
        fetchPendingRequests(); // refresh requests list
      } catch(e) {
        toast.error(e.response?.data?.message || "Failed to approve transfer");
      }
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Agent Dashboard</h2>
        <Link to="/agent/add-property" className="btn btn-success">Add New Property</Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">My Properties</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>City</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-3">No properties listed yet.</td>
                  </tr>
                ) : (
                  properties.map(property => (
                    <tr key={property.id}>
                      <td>{property.title}</td>
                      <td>{property.city}</td>
                      <td>₹{property.price}</td>
                      <td>
                        <span className={`badge ${property.status === 'available' ? 'bg-success' : 'bg-secondary'}`}>
                          {property.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/agent/edit-property/${property.id}`} className="btn btn-sm btn-outline-primary me-2">Edit</Link>
                        <button onClick={() => handleDelete(property.id)} className="btn btn-sm btn-outline-danger">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-5 border-warning">
        <div className="card-header bg-warning text-dark">
          <h5 className="mb-0">Pending Room Transfer Requests</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Property</th>
                  <th>Current Tenant</th>
                  <th>Requested By</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-3">No pending requests.</td>
                  </tr>
                ) : (
                  pendingRequests.map(req => (
                    <tr key={req.id}>
                      <td>{req.property_title}</td>
                      <td>{req.original_tenant}</td>
                      <td>
                        {req.requester_name} <br/>
                        <small className="text-muted">{req.requester_email}</small>
                      </td>
                      <td>{req.transfer_reason}</td>
                      <td>
                        <button onClick={() => handleApproveTransfer(req.id)} className="btn btn-sm btn-success">Approve Transfer</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
