import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const ReviewList = ({ propertyId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', booking_id: '' });
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
          <h5>Leave a Review</h5>
          <div className="mb-3">
            <label>Rating</label>
            <select 
              className="form-select" 
              value={newReview.rating} 
              onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}
            >
              {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
            </select>
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

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div className="list-group">
          {reviews.map(r => (
            <div key={r.id} className="list-group-item">
              <div className="d-flex w-100 justify-content-between">
                <h6 className="mb-1">{r.user_name}</h6>
                <small className="text-warning">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</small>
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
