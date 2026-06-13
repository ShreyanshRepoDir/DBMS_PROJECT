import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchProperties = async (searchParams = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/properties${searchParams}`);
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(location.search);
  }, [location.search]);

  const handleSearch = (filters) => {
    const query = new URLSearchParams();
    if(filters.city) query.append('city', filters.city);
    if(filters.type) query.append('type', filters.type);
    fetchProperties(`?${query.toString()}`);
  };

  return (
    <div>
      <h2 className="mb-4">Browse Properties</h2>
      <SearchBar onSearch={handleSearch} />
      
      {loading ? (
        <div className="text-center"><div className="spinner-border text-primary" role="status"></div></div>
      ) : properties.length === 0 ? (
        <div className="alert alert-info">No properties found matching your criteria.</div>
      ) : (
        <div className="row">
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyList;
