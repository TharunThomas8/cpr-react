import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <h2>Home Page</h2>
      <Link to="/cpr">
        <button>CPR Training</button>
      </Link>
    </div>
  );
};

export default HomePage;
