import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, propertiesRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/bookings'),
        api.get('/properties')
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setProperties(propertiesRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteProperty = async (id) => {
    if(window.confirm('Are you sure you want to delete this property? This will also delete related bookings and reviews.')) {
      try {
        await api.delete(`/properties/${id}`);
        toast.success("Property deleted");
        fetchDashboardData(); // refresh all data
      } catch(e) {
        toast.error("Failed to delete property");
      }
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;
  if (!stats) return <div className="alert alert-danger">Error loading stats.</div>;

  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="row mb-5">
        <div className="col-md-3">
          <div className="card text-white bg-success mb-3">
            <div className="card-header">Total Revenue</div>
            <div className="card-body">
              <h4 className="card-title">₹{stats.totalRevenue}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info mb-3">
            <div className="card-header">Average Rating</div>
            <div className="card-body">
              <h4 className="card-title">{Number(stats.averageRating).toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card text-white bg-primary mb-3">
            <div className="card-header">Most Booked City</div>
            <div className="card-body">
              <h4 className="card-title">{stats.mostBookedCity?.city || 'N/A'}</h4>
              <p className="card-text">{stats.mostBookedCity?.booking_count || 0} bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="mb-5">
        <h4>All Bookings</h4>
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Property</th>
                    <th>City</th>
                    <th>Customer</th>
                    <th>Dates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-3">No bookings found.</td></tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b.id}>
                        <td>#{b.id}</td>
                        <td>{b.property_title}</td>
                        <td>{b.property_city}</td>
                        <td>{b.user_name} <br/><small className="text-muted">{b.user_email}</small></td>
                        <td>{new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${b.status === 'confirmed' || b.status === 'completed' ? 'bg-success' : b.status === 'pending' ? 'bg-warning' : 'bg-danger'}`}>
                            {b.status}
                          </span>
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

      {/* Properties Management Section */}
      <div className="mb-5">
        <h4>Manage All Properties</h4>
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Agent</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-3">No properties found.</td></tr>
                  ) : (
                    properties.map(p => (
                      <tr key={p.id}>
                        <td>{p.title}</td>
                        <td>{p.agent_name}</td>
                        <td>{p.city}</td>
                        <td>
                          <span className={`badge ${p.status === 'available' ? 'bg-success' : 'bg-secondary'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                           <button onClick={() => handleDeleteProperty(p.id)} className="btn btn-sm btn-outline-danger">Delete</button>
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

      {/* Top Agents Section */}
      <div>
        <h4>Top Agents</h4>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Agent Name</th>
                <th>Properties Listed</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {stats.topAgents.map((agent, index) => (
                <tr key={index}>
                  <td>{agent.name}</td>
                  <td>{agent.properties_listed}</td>
                  <td>{agent.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
