import React from 'react';
import { Link } from 'react-router-dom';

const PropertyCard = ({ property }) => {
  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">{property.title}</h5>
          <h6 className="card-subtitle mb-2 text-muted">{property.city} - {property.type}</h6>
          <p className="card-text text-truncate">{property.description}</p>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="h5 mb-0 text-success">${property.price}</span>
            <span className={`badge ${property.status === 'available' ? 'bg-success' : 'bg-danger'}`}>
              {property.status}
            </span>
          </div>
        </div>
        <div className="card-footer bg-white border-top-0">
          <Link to={`/properties/${property.id}`} className="btn btn-primary w-100">View Details</Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
