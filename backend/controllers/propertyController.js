const pool = require('../config/db');

const MOCK_PROPERTIES = [
  {
    id: 1,
    agent_id: 1,
    title: 'Luxury Villa',
    description: 'Beautiful 4 bedroom villa with pool',
    city: 'Bengaluru',
    price: 50000000,
    type: 'villa',
    status: 'available',
    created_at: '2023-01-01T00:00:00.000Z',
    agent_name: 'Agent Smith',
    bio: 'Top real estate agent in the city.'
  },
  {
    id: 2,
    agent_id: 1,
    title: 'Downtown Apartment',
    description: 'Modern apartment in city center',
    city: 'Bengaluru',
    price: 15000000,
    type: 'apartment',
    status: 'available',
    created_at: '2023-01-01T00:00:00.000Z',
    agent_name: 'Agent Smith',
    bio: 'Top real estate agent in the city.'
  },
  {
    id: 3,
    agent_id: 1,
    title: 'Suburban House',
    description: 'Quiet family home',
    city: 'Bengaluru',
    price: 20000000,
    type: 'house',
    status: 'available',
    created_at: '2023-01-01T00:00:00.000Z',
    agent_name: 'Agent Smith',
    bio: 'Top real estate agent in the city.'
  },
  {
    id: 4,
    agent_id: 1,
    title: 'Commercial Space',
    description: 'Large office space',
    city: 'Bengaluru',
    price: 80000000,
    type: 'commercial',
    status: 'available',
    created_at: '2023-01-01T00:00:00.000Z',
    agent_name: 'Agent Smith',
    bio: 'Top real estate agent in the city.'
  },
  {
    id: 5,
    agent_id: 1,
    title: 'Luxury Condo',
    description: 'Stunning city views',
    city: 'Bengaluru',
    price: 30000000,
    type: 'apartment',
    status: 'available',
    created_at: '2023-01-01T00:00:00.000Z',
    agent_name: 'Agent Smith',
    bio: 'Top real estate agent in the city.'
  }
];

exports.getProperties = async (req, res) => {
  const { city, type } = req.query;
  
  let results = MOCK_PROPERTIES;
  if (city) {
    results = results.filter(p => p.city.toLowerCase().includes(city.toLowerCase()));
  }
  if (type) {
    results = results.filter(p => p.type === type);
  }
  
  return res.json(results);
};

exports.getPropertyById = async (req, res) => {
  const property = MOCK_PROPERTIES.find(p => p.id === parseInt(req.params.id));
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  return res.json(property);
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
