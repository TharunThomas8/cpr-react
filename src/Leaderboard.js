import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { api_base } from './config';
import './Screen2.css'
import { useHistory } from "react-router-dom";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';



const GoBackButton = () => {
  const history = useHistory();

  const goBack = () => {
    history.goBack();
  };

  return (
    <button className='button' onClick={goBack}>
      <FontAwesomeIcon icon={faArrowLeft} />
    </button>
  );
};

const Leaderboard = () => {
  const [topScores, setTopScores] = useState([]);

  useEffect(() => {
    axios.get(api_base + 'get-top-scores')
      .then(response => {
        const topScores = response.data;

        const topScoresObj = Object.values(topScores);
        const topScoresArray = topScoresObj[1];

        topScoresArray.sort((a, b) => b.topScore.gameScore - a.topScore.gameScore);
        
        setTopScores(topScoresArray);
      })
      .catch(error => {
        console.log(error);
      });

  }, []);

  return (
    <div>
      <GoBackButton />
      <center><h1>Leaderboard</h1></center>
      {topScores.length === 0 ? (
        <p>No top scores available.</p>
      ) : (
        <div className="table-container">
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
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
