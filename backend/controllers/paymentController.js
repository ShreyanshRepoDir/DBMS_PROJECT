const pool = require('../config/db');

exports.processPayment = async (req, res) => {
  const { booking_id, amount, method } = req.body;

  try {
    // Basic validation
    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (bookingCheck.rows[0].status === 'confirmed') {
      return res.status(400).json({ message: 'Booking already paid and confirmed' });
    }

    // Call PostgreSQL Function to handle transaction
    await pool.query('SELECT confirm_booking($1, $2, $3)', [booking_id, amount, method]);

    res.json({ message: 'Payment successful, booking confirmed' });
  } catch (err) {
    console.error(err.message);
    // If it's a unique constraint violation on payment
    if (err.code === '23505') {
       return res.status(400).json({ message: 'Payment already exists for this booking' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};
