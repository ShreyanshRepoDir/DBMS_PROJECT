const pool = require('../config/db');

exports.createBooking = async (req, res) => {
  const { property_id, start_date, end_date } = req.body;
  const user_id = req.user.id;

  try {
    // Check if property exists and is available
    const propCheck = await pool.query('SELECT status FROM properties WHERE id = $1', [property_id]);
    if (propCheck.rows.length === 0) return res.status(404).json({ message: 'Property not found' });
    
    // We attempt to insert, if duplicate dates overlap according to trigger, it will throw
    const newBooking = await pool.query(
      'INSERT INTO bookings (user_id, property_id, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, property_id, start_date, end_date, 'pending']
    );

    res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    if (err.message.includes('Property already has an active booking')) {
        return res.status(400).json({ message: 'Property not available for these dates' });
    }
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await pool.query(
      `SELECT b.*, p.title, p.city, p.price 
       FROM bookings b 
       JOIN properties p ON b.property_id = p.id 
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(bookings.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const bookingId = req.params.id;

  try {
    const updatedBooking = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, bookingId]
    );

    if (updatedBooking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(updatedBooking.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
