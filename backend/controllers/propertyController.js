const pool = require('../config/db');

exports.getProperties = async (req, res) => {
  const { city, type } = req.query;
  try {
    let query = 'SELECT p.*, a.bio, u.name as agent_name FROM properties p JOIN agents a ON p.agent_id = a.id JOIN users u ON a.user_id = u.id WHERE 1=1';
    let queryParams = [];
    let paramIndex = 1;

    if (city) {
      query += ` AND p.city ILIKE $${paramIndex}`;
      queryParams.push(`%${city}%`);
      paramIndex++;
    }

    if (type) {
      query += ` AND p.type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    query += ' ORDER BY p.created_at DESC';

    const properties = await pool.query(query, queryParams);
    res.json(properties.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const property = await pool.query(
      `SELECT p.*, a.bio, u.name as agent_name 
       FROM properties p 
       JOIN agents a ON p.agent_id = a.id 
       JOIN users u ON a.user_id = u.id 
       WHERE p.id = $1`, 
      [req.params.id]
    );

    if (property.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createProperty = async (req, res) => {
  const { title, description, city, price, type } = req.body;
  const agentId = req.user.agentId; // from token via authMiddleware

  if (!agentId) return res.status(403).json({ message: 'Only agents can create properties' });

  try {
    const newProperty = await pool.query(
      'INSERT INTO properties (agent_id, title, description, city, price, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [agentId, title, description, city, price, type]
    );

    res.status(201).json(newProperty.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateProperty = async (req, res) => {
  const { title, description, city, price, type, status } = req.body;
  const propertyId = req.params.id;
  const agentId = req.user.agentId;

  try {
    // Check ownership
    const propCheck = await pool.query('SELECT agent_id FROM properties WHERE id = $1', [propertyId]);
    if (propCheck.rows.length === 0) return res.status(404).json({ message: 'Property not found' });
    
    if (propCheck.rows[0].agent_id !== agentId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    const updatedProperty = await pool.query(
      'UPDATE properties SET title = COALESCE($1, title), description = COALESCE($2, description), city = COALESCE($3, city), price = COALESCE($4, price), type = COALESCE($5, type), status = COALESCE($6, status) WHERE id = $7 RETURNING *',
      [title, description, city, price, type, status, propertyId]
    );

    res.json(updatedProperty.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.deleteProperty = async (req, res) => {
  const propertyId = req.params.id;
  const agentId = req.user.agentId;

  try {
    // Check ownership
    const propCheck = await pool.query('SELECT agent_id FROM properties WHERE id = $1', [propertyId]);
    if (propCheck.rows.length === 0) return res.status(404).json({ message: 'Property not found' });
    
    if (propCheck.rows[0].agent_id !== agentId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await pool.query('DELETE FROM properties WHERE id = $1', [propertyId]);
    res.json({ message: 'Property removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getMyProperties = async (req, res) => {
  const agentId = req.user.agentId;
  
  if (!agentId) return res.status(403).json({ message: 'Only agents can view their properties' });

  try {
    const properties = await pool.query(
      'SELECT * FROM properties WHERE agent_id = $1 ORDER BY created_at DESC',
      [agentId]
    );
    res.json(properties.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
