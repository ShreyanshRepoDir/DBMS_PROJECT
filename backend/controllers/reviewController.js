const pool = require('../config/db');

exports.getReviews = async (req, res) => {
  try {
    const reviews = await pool.query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       JOIN bookings b ON r.booking_id = b.id
       JOIN users u ON r.user_id = u.id
       WHERE b.property_id = $1 ORDER BY r.created_at DESC`,
      [req.params.propertyId]
    );
    res.json(reviews.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.addReview = async (req, res) => {
  const { booking_id, rating, comment } = req.body;
  const user_id = req.user.id;

  try {
    // Ensure user actually booked and it's confirmed or completed
    const bookingCheck = await pool.query(
      'SELECT status FROM bookings WHERE id = $1 AND user_id = $2',
      [booking_id, user_id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You can only review your own bookings' });
    }

    if (!['confirmed', 'completed'].includes(bookingCheck.rows[0].status)) {
       return res.status(400).json({ message: 'Booking must be confirmed or completed to leave a review' });
    }

    const newReview = await pool.query(
      'INSERT INTO reviews (booking_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [booking_id, user_id, rating, comment]
    );

    res.status(201).json(newReview.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
       return res.status(400).json({ message: 'You have already reviewed this booking' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};
