import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { api_base } from './config';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';

const Leaderboard = () => {
  const [topScores, setTopScores] = useState([]);

  useEffect(() => {
    // Fetch the top scores data from the API
    axios.get(api_base+'get-top-scores')
      .then(response => {
        // Update the state with the top scores data
        setTopScores(response.data.topScores);
      })
      .catch(error => {
        console.log(error);
      });
  }, []);

  return (
    <div>
      <h1>Leaderboard</h1>
      {topScores.length === 0 ? (
        <p>No top scores available.</p>
      ) : (
        <>
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Username</th>
              <th>Score (s)</th>
            </tr>
          </thead>
          <tbody>
            {topScores.map((score, index) => (
              <tr key={score.userId}>
                <td>{index + 1}</td>
                <td>{score.userId}</td>
                <td>{(score.topScore.gameScore / 1000).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link to={`/`}>
          <button>Home</button>
        </Link>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
