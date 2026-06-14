import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ReviewList from '../components/ReviewList';
import { toast } from 'react-toastify';

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        setProperty(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    const checkFavorite = async () => {
        if (!user) return;
        try {
            const res = await api.get('/favorites');
            if(res.data.find(f => f.id === Number(id))) {
                setIsFavorite(true);
            }
        } catch(e) { console.error(e) }
    };

    fetchProperty();
    checkFavorite();
  }, [id, user]);

  const toggleFavorite = async () => {
      if (!user) {
          toast.info("Please login to add favorites");
          return navigate('/login');
      }
      try {
          if (isFavorite) {
              await api.delete(`/favorites/${id}`);
              setIsFavorite(false);
              toast.success("Removed from favorites");
          } else {
              await api.post('/favorites', { property_id: id });
              setIsFavorite(true);
              toast.success("Added to favorites");
          }
      } catch (err) {
          toast.error("Error updating favorites");
      }
  }

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;
  if (!property) return <div className="alert alert-danger">Property not found</div>;

  return (
    <div className="row">
      <div className="col-md-8">
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="card-title mb-0">{property.title}</h2>
              <button 
                  className={`btn ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={toggleFavorite}
              >
                  {isFavorite ? '♥ Favorited' : '♡ Add to Favorites'}
              </button>
            </div>
            
            <h5 className="text-muted">{property.city} - {property.type}</h5>
            <span className={`badge ${property.status === 'available' ? 'bg-success' : 'bg-danger'} mb-3`}>
              {property.status}
            </span>
            <p className="card-text" style={{ whiteSpace: 'pre-line' }}>{property.description}</p>
            
            <hr />
            <h5>Agent Information</h5>
            <p><strong>Name:</strong> {property.agent_name}</p>
            <p><strong>Bio:</strong> {property.bio || 'No bio available.'}</p>
          </div>
        </div>
        
        {/* Reviews Section */}
        <ReviewList propertyId={id} />
      </div>

      <div className="col-md-4">
        <div className="card shadow-sm sticky-top" style={{ top: '20px' }}>
          <div className="card-body text-center">
            <h3 className="text-success mb-4">₹{property.price}</h3>
            {property.status === 'available' ? (
              <Link to={`/book/${property.id}`} className="btn btn-primary btn-lg w-100 mb-2">Book Now</Link>
            ) : (
              <button className="btn btn-secondary btn-lg w-100 mb-2" disabled>Not Available</button>
            )}
            <small className="text-muted">You will not be charged yet.</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
