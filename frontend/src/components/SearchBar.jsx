import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [filters, setFilters] = useState({ city: '', type: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  return (
    <form className="row g-3 mb-4" onSubmit={handleSearch}>
      <div className="col-md-5">
        <input 
          type="text" 
          className="form-control" 
          placeholder="Filter by City..." 
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        />
      </div>
      <div className="col-md-5">
        <select 
          className="form-select" 
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="villa">Villa</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>
      <div className="col-md-2">
        <button type="submit" className="btn btn-primary w-100">Search</button>
      </div>
    </form>
  );
};

export default SearchBar;
