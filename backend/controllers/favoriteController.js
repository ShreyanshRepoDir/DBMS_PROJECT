const pool = require('../config/db');

exports.getFavorites = async (req, res) => {
  try {
    const favorites = await pool.query(
      `SELECT p.* 
       FROM properties p 
       JOIN favorites f ON p.id = f.property_id 
       WHERE f.user_id = $1`,
      [req.user.id]
    );
    res.json(favorites.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.addFavorite = async (req, res) => {
  const { property_id } = req.body;
  try {
    await pool.query('INSERT INTO favorites (user_id, property_id) VALUES ($1, $2)', [req.user.id, property_id]);
    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Already in favorites' });
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.removeFavorite = async (req, res) => {
  const propertyId = req.params.propertyId;
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND property_id = $2', [req.user.id, propertyId]);
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
