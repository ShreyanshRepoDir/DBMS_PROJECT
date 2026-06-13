import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'credit_card' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        booking_id: bookingId,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method
      });
      toast.success('Payment successful! Booking Confirmed.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Payment failed');
    }
  };

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-md-5">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h2 className="mb-4 text-center">Complete Payment</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Amount</label>
                <input type="number" className="form-control" required step="0.01" min="0.01"
                       value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} />
                <small className="text-muted">Enter exact property price to validate.</small>
              </div>
              <div className="mb-4">
                <label>Payment Method</label>
                <select className="form-select" value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})}>
                  <option value="credit_card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success w-100">Pay Now</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
