const pool = require('../config/db');

// List a booking on the marketplace
exports.listTransfer = async (req, res) => {
  const { booking_id, reason } = req.body;
  const user_id = req.user.id;

  try {
    // Ensure the booking belongs to the user and is confirmed
    const bookingCheck = await pool.query(
      'SELECT status FROM bookings WHERE id = $1 AND user_id = $2',
      [booking_id, user_id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You can only transfer your own bookings' });
    }

    if (bookingCheck.rows[0].status !== 'confirmed') {
       return res.status(400).json({ message: 'Only confirmed bookings can be transferred' });
    }

    // Ensure it's not already listed and open
    const transferCheck = await pool.query(
      'SELECT * FROM room_transfers WHERE booking_id = $1 AND status = $2',
      [booking_id, 'open']
    );

    if (transferCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Booking is already listed for transfer' });
    }

    const newTransfer = await pool.query(
      'INSERT INTO room_transfers (booking_id, reason) VALUES ($1, $2) RETURNING *',
      [booking_id, reason]
    );

    res.status(201).json(newTransfer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get marketplace listings
exports.getMarketplace = async (req, res) => {
  try {
    const transfers = await pool.query(
      `SELECT t.*, b.start_date, b.end_date, p.title as property_title, p.city, p.price, u.name as current_tenant
       FROM room_transfers t
       JOIN bookings b ON t.booking_id = b.id
       JOIN properties p ON b.property_id = p.id
       JOIN users u ON b.user_id = u.id
       WHERE t.status = 'open'
       ORDER BY t.created_at DESC`
    );
    res.json(transfers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Request a transfer
exports.requestTransfer = async (req, res) => {
  const { transfer_id } = req.body;
  const requester_id = req.user.id;

  try {
    const transferCheck = await pool.query('SELECT * FROM room_transfers WHERE id = $1 AND status = $2', [transfer_id, 'open']);
    if (transferCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Transfer not found or not open' });
    }

    const bookingCheck = await pool.query('SELECT user_id FROM bookings WHERE id = $1', [transferCheck.rows[0].booking_id]);
    if (bookingCheck.rows[0].user_id === requester_id) {
       return res.status(400).json({ message: 'You cannot request your own transfer' });
    }

    const reqCheck = await pool.query('SELECT * FROM transfer_requests WHERE transfer_id = $1 AND requester_id = $2', [transfer_id, requester_id]);
    if (reqCheck.rows.length > 0) {
       return res.status(400).json({ message: 'You have already requested this transfer' });
    }

    const newRequest = await pool.query(
      'INSERT INTO transfer_requests (transfer_id, requester_id) VALUES ($1, $2) RETURNING *',
      [transfer_id, requester_id]
    );

    res.status(201).json(newRequest.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get pending requests (for Agents/Admins)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await pool.query(
      `SELECT r.*, t.reason as transfer_reason, u.name as requester_name, u.email as requester_email, 
              p.title as property_title, p.id as property_id,
              orig_u.name as original_tenant
       FROM transfer_requests r
       JOIN room_transfers t ON r.transfer_id = t.id
       JOIN users u ON r.requester_id = u.id
       JOIN bookings b ON t.booking_id = b.id
       JOIN properties p ON b.property_id = p.id
       JOIN users orig_u ON b.user_id = orig_u.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at ASC`
    );
    res.json(requests.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Approve transfer
exports.approveTransfer = async (req, res) => {
  const { request_id } = req.body;
  const approved_by = req.user.id;

  try {
    await pool.query('BEGIN');

    const requestCheck = await pool.query('SELECT * FROM transfer_requests WHERE id = $1 AND status = $2', [request_id, 'pending']);
    if (requestCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Request not found or not pending' });
    }
    const transferReq = requestCheck.rows[0];

    const transferCheck = await pool.query('SELECT * FROM room_transfers WHERE id = $1', [transferReq.transfer_id]);
    const transfer = transferCheck.rows[0];

    // Create approval
    await pool.query(
      'INSERT INTO transfer_approvals (request_id, approved_by) VALUES ($1, $2)',
      [request_id, approved_by]
    );

    // Update request status
    await pool.query("UPDATE transfer_requests SET status = 'accepted' WHERE id = $1", [request_id]);
    // Reject other requests for this transfer
    await pool.query("UPDATE transfer_requests SET status = 'rejected' WHERE transfer_id = $1 AND id != $2", [transfer.id, request_id]);

    // Update transfer status
    await pool.query("UPDATE room_transfers SET status = 'completed' WHERE id = $1", [transfer.id]);

    // Update booking user_id
    await pool.query("UPDATE bookings SET user_id = $1 WHERE id = $2", [transferReq.requester_id, transfer.booking_id]);

    await pool.query('COMMIT');
    res.json({ message: 'Transfer approved successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
