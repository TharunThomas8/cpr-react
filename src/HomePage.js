import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api_base } from './config';
import './HomePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';


const HomePage = () => {
  const [data, setData] = useState([]);
  const [topScore, setTopScore] = useState(0);
  const [recentScore, setRecentScore] = useState(0);
  const [userId, setUserId] = useState(sessionStorage.getItem('userId') || "");
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [userExists, setUserExists] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const optimalCPR = (detail) => {



    let sets = [];

    for (let i = 0; i < detail.reps.length - 2; i++) {
      let set = detail.reps.slice(i, i + 3);

      // Check if the set contains exactly 3 repTime values
      let repTimeCount = set.filter(rep => rep.hasOwnProperty("repTime")).length;
      if (repTimeCount === 3) {
        sets.push(set.map(rep => rep.repTime));
      }
    }

    let withinRangeCount = 0;

    for (let set of sets) {
      let totalDuration = set[set.length - 1] - set[0];
      let cprRate = (3) / ((totalDuration + 500) / 60000);

      if (100 <= cprRate && cprRate <= 120) {
        withinRangeCount++;
      }
    }

    let percentageWithinRange = (withinRangeCount / sets.length) * 100;

    return percentageWithinRange;

  };

  const handleUserIdChange = (event) => {
    setUserId(event.target.value);
  };

  const fetchData = () => {
    if (userId) {

      try {
        axios.get(api_base + 'get-last/' + userId)
          .then(response => {
            const responseData = response.data;
            if (responseData.success) {
              responseData.data.reverse();
              setData(responseData.data);
              handleTandC(responseData.data);
              setIsDataFetched(true);
              setUserExists(true);
            } else {
              setUserExists(false);
            }
          })
          .catch(error => {
            console.log(error);
            setUserExists(false);
          });
      } catch (error) {
        console.log(error);
      }

      try {
        axios.get(api_base + 'get-recent-score/' + userId)
          .then(response => {
            const responseData = response.data;
            if (responseData.success) {
              setRecentScore(responseData.recentScore.gameScore);
            }
          })
          .catch(error => {
            console.log(error);
            setRecentScore(0);
          }
          );
      } catch (error) {
        console.log(error);
        setRecentScore(0);
      }

      try {
        axios.get(api_base + 'get-top-score/' + userId)
          .then(response => {
            const responseData = response.data;
            if (responseData.success) {
              setTopScore(responseData.topScore);
            }
          }
          )
          .catch(error => {
            console.log(error);
            setTopScore(0);
          }
          );
      } catch (error) {
        console.log(error);
      }

    }
  };

  const handleTandC = (temp_data) => {
    if (temp_data.length === 0) {
      const confirmed = window.confirm("You will required to provide access to your camera, to provide real-time feedback. All data stored by the system will also be viewable to your assigned trainer. Note: NO PICTURES or VIDEOS are being stored by the application. Do you accept the terms and conditions?");
      if (confirmed) {
        setAcceptedTerms(true);
      } else {
        setAcceptedTerms(false);
      }
    }
    else {
      setAcceptedTerms(true);
    }
  };

  useEffect(() => {
    setIsDataFetched(false);
    setUserExists(true);

    const storedUserId = sessionStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchData();
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('userId', userId);
  }, [userId]);

  const changeUser = () => {
    setUserId("");
    setIsDataFetched(false);
    setUserExists(true);
  };

  return (
    <div>
      {!isDataFetched ? (
        <>

          <Link to={`/landing`}>
            <button className='button'><FontAwesomeIcon icon={faHome} /></button>
          </Link>
          <br />
          <div>
            <input className="input-container" type="text" value={userId} onChange={handleUserIdChange} placeholder="Enter User ID" />
            <button onClick={fetchData} className='button'>Login</button>
          </div>
          {!userExists && <p>User doesn't exist.</p>}
        </>
      ) : (
        <>
          <button className='button' onClick={changeUser}>Change User</button>
          <br />
          <p>Welcome {userId}</p>
          {data.length === 0 ? (<p>No data available.</p>) :
            (<div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Rate</th>
                    <th>Fraction</th>
                    <th>Optimal</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(item => (
                    <tr key={item._id}>
                      <td className={item.cprRate >= 100 && item.cprRate <= 120 ? 'green' : 'red'}>{item.cprRate.toFixed(0)}</td>
                      <td>{item.cprFraction.toFixed(0)}</td>
                      <td>
                        <div className="pie animate" style={{ '--p': optimalCPR(item), '--c': 'lightgreen' }}>
                          {optimalCPR(item).toFixed(0)}
                        </div>
                      </td>
                      <td>{item.feedback ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>)}

          <div className='game-scores'>
            <h2>Game Scores</h2>

            {topScore === 0.0 ? (
              <p>No top scores available.</p>
            ) : (
              <div>
                <p>My Top Score: {(topScore / 1000).toFixed(1)} s</p>
              </div>
            )}

            {recentScore === 0.0 ? (
              <p>No recent score available.</p>
            ) : (
              <div>
                <p>My Recent Score: {(recentScore / 1000).toFixed(1)} s</p>
              </div>
            )}
          </div>


        </>
      )}
      {isDataFetched && (
        <>
          <Link to={`/cpr/${userId}`}>
            <button className='button' disabled={!acceptedTerms}>CPR Training</button>
          </Link>

          <Link to={`/report/${userId}`} >
            <button className='button' disabled={(data.length === 0)}>Report</button>
          </Link>

          <Link to={`/game/${userId}`} >
            <button className='button' disabled={!acceptedTerms}>Game</button>
          </Link>
          <Link to={`/leaderboard`} >
            <button className='button' >Leaderboard</button>
          </Link>
        </>
      )
      }

    </div >
  );
};

export default HomePage;
