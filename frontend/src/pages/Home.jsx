import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';

const Home = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/properties');
        setFeaturedProperties(res.data.slice(0, 3)); // show first 3
      } catch (err) {
        console.error(err);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (filters) => {
    const query = new URLSearchParams(filters).toString();
    navigate(`/properties?${query}`);
  };

  return (
    <div>
      <div className="p-5 mb-4 bg-light rounded-3 text-center">
        <div className="container-fluid py-5">
          <h1 className="display-5 fw-bold">Find Your Dream Property</h1>
          <p className="col-md-8 mx-auto fs-4">Browse from thousands of luxury apartments, houses, and commercial spaces.</p>
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      <div className="row mt-5">
        <h2 className="mb-4 text-center">Featured Properties</h2>
        {featuredProperties.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
      
      <div className="text-center mt-4 mb-5">
         <Link to="/properties" className="btn btn-outline-primary btn-lg">View All Properties</Link>
      </div>
    </div>
  );
};

export default Home;
