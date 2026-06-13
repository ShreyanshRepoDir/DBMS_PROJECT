const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalRevenueResult = await pool.query('SELECT SUM(amount) as total_revenue FROM payments');
    
    const mostBookedCityResult = await pool.query(
      `SELECT p.city, COUNT(b.id) as booking_count 
       FROM properties p 
       JOIN bookings b ON p.id = b.property_id 
       GROUP BY p.city 
       ORDER BY booking_count DESC 
       LIMIT 1`
    );

    const topAgentsResult = await pool.query(
      `SELECT u.name, a.rating, COUNT(p.id) as properties_listed
       FROM agents a
       JOIN users u ON a.user_id = u.id
       JOIN properties p ON p.agent_id = a.id
       GROUP BY u.name, a.rating
       ORDER BY a.rating DESC
       LIMIT 5`
    );

    const avgRatingsResult = await pool.query('SELECT AVG(rating) as avg_rating FROM reviews');

    res.json({
      totalRevenue: totalRevenueResult.rows[0].total_revenue || 0,
      mostBookedCity: mostBookedCityResult.rows[0] || null,
      topAgents: topAgentsResult.rows,
      averageRating: avgRatingsResult.rows[0].avg_rating || 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await pool.query(
      `SELECT b.id, b.start_date, b.end_date, b.status, 
              p.title as property_title, p.city as property_city, p.id as property_id,
              u.name as user_name, u.email as user_email
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    );
    res.json(bookings.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
