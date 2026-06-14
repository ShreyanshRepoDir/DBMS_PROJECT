import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const ReviewList = ({ propertyId }) => {
  const [reviews, setReviews] = useState([]);
  const [livingScore, setLivingScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ 
    rating_food: 10, rating_wifi: 10, rating_safety: 10, 
    rating_study_env: 10, rating_water: 10, rating_cleanliness: 10, 
    comment: '', booking_id: '' 
  });
  const { user } = useContext(AuthContext);
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    fetchReviews();
    if (user) {
        fetchMyBookings();
    }
  }, [propertyId, user]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/${propertyId}`);
      setReviews(res.data);
      const scoreRes = await api.get(`/reviews/score/${propertyId}`);
      setLivingScore(scoreRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
      try {
          const res = await api.get('/bookings/my');
          // Filter to only include confirmed/completed bookings for THIS property
          const validBookings = res.data.filter(b => b.property_id === Number(propertyId) && ['confirmed', 'completed'].includes(b.status));
          setMyBookings(validBookings);
          if (validBookings.length > 0) {
              setNewReview(prev => ({ ...prev, booking_id: validBookings[0].id }));
          }
      } catch(error) {
          console.error(error);
      }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if(!newReview.booking_id) {
        toast.error("No eligible booking found to review.");
        return;
    }
    try {
      await api.post('/reviews', newReview);
      toast.success('Review added successfully');
      setNewReview({ ...newReview, comment: '' }); // reset comment
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding review');
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="mt-4">
      <h4>Reviews</h4>
      {myBookings.length > 0 && (
        <form onSubmit={handleSubmitReview} className="mb-4 card p-3">
          <h5>Leave a Detailed Review</h5>
          <div className="row">
            {['food', 'wifi', 'safety', 'study_env', 'water', 'cleanliness'].map(metric => (
              <div className="col-md-4 mb-3" key={metric}>
                <label className="text-capitalize">{metric.replace('_', ' ')} Rating</label>
                <select 
                  className="form-select" 
                  value={newReview[`rating_${metric}`]} 
                  onChange={e => setNewReview({...newReview, [`rating_${metric}`]: Number(e.target.value)})}
                >
                  {[10,9,8,7,6,5,4,3,2,1].map(num => <option key={num} value={num}>{num} / 10</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label>Comment</label>
            <textarea 
              className="form-control" 
              value={newReview.comment} 
              onChange={e => setNewReview({...newReview, comment: e.target.value})}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Submit Review</button>
        </form>
      )}

      {livingScore && (
        <div className="card bg-light mb-4 p-3 border-success">
          <h5 className="text-success mb-3">Senior Verified Living Score: <strong>{livingScore.living_score} / 10</strong></h5>
          <div className="row text-center">
             <div className="col-4 col-md-2">Food: {livingScore.avg_food}</div>
             <div className="col-4 col-md-2">WiFi: {livingScore.avg_wifi}</div>
             <div className="col-4 col-md-2">Safety: {livingScore.avg_safety}</div>
             <div className="col-4 col-md-2">Study: {livingScore.avg_study_env}</div>
             <div className="col-4 col-md-2">Water: {livingScore.avg_water}</div>
             <div className="col-4 col-md-2">Clean: {livingScore.avg_cleanliness}</div>
          </div>
          <small className="text-muted mt-2 d-block text-center">Based on {livingScore.total_reviews} student reviews</small>
        </div>
      )}

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div className="list-group">
          {reviews.map(r => (
            <div key={r.id} className="list-group-item">
              <div className="d-flex w-100 justify-content-between">
                <h6 className="mb-1">{r.user_name}</h6>
                <small className="text-success">Food: {r.rating_food}/10 | WiFi: {r.rating_wifi}/10 | Safety: {r.rating_safety}/10</small>
              </div>
              <p className="mb-1">{r.comment}</p>
              <small className="text-muted">{new Date(r.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList;
