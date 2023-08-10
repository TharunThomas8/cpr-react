import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; 

const LandingPage = () => {
  return (
    <div className="landing-container">
      <h1 className="landing-heading">CPR Training Assistant</h1>
      <div className="button-container">
        <Link to="/">
          <button className="button">User Login</button>
        </Link>
        <Link to="/trainer">
          <button className="button">Trainer Login</button>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
