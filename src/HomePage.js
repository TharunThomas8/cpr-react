import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api_base } from './config';

// const api_base = "http://127.0.0.1:5000";

const HomePage = () => {
  const [data, setData] = useState([]);
  const [userId, setUserId] = useState(sessionStorage.getItem('userId') || "");
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [userExists, setUserExists] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // console.log(userId);

  const handleUserIdChange = (event) => {
    setUserId(event.target.value);
  };

  const fetchData = () => {
    if (userId) {
      // Make Axios GET request with the user ID

      axios.get('/get-last/' + userId)
        .then(response => {
          const responseData = response.data;
          console.log(responseData);
          if (responseData.success) {
            setData(responseData.data); // Access the CPR details array
            console.log(responseData.data);
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
    }
  };

  const handleTandC = (temp_data) => {
    // console.log(temp_data.length);
    if (temp_data.length === 0) {
      const confirmed = window.confirm("Do you accept the terms and conditions?");
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

    // Check if userId exists in sessionStorage
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
      <h2>Home Page</h2>
      {!isDataFetched ? (
        <>

          <Link to="/trainer">
            <button>Trainer</button>
          </Link>
          <br />
          <input type="text" value={userId} onChange={handleUserIdChange} placeholder="Enter User ID" />
          <button onClick={fetchData}>Fetch Data</button>
          {!userExists && <p>User doesn't exist.</p>}
        </>
      ) : (
        <>
          <button onClick={changeUser}>Change User</button>
          <br />
          <h5>User: {userId}</h5>
          {/* Display the fetched data as a table */}
          {data.length === 0 ? (<p>No data available.</p>) :
            (<table>
              <thead>
                <tr>
                  <th>CPRrate</th>
                  <th>cprFraction</th>
                  <th>compression</th>
                  <th>feedback</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item._id}>
                    <td>{item.cprRate}</td>
                    <td>{item.cprFraction}</td>
                    <td>{item.compression}</td>
                    <td>{item.feedback ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>)}

        </>
      )}
      {isDataFetched && (
        <>
          <Link to={`/cpr/${userId}`}>
            <button disabled={!acceptedTerms}>CPR Training</button>
          </Link>

          <Link to={`/report/${userId}`} >
            <button disabled={(data.length === 0)}>Report</button>
          </Link>
        </>
      )
      }

    </div >
  );
};

export default HomePage;
