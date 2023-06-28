import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import { VictoryChart, VictoryScatter, VictoryAxis, VictoryTheme, VictoryLegend, VictoryLine, VictoryArea } from 'victory';
import { api_base } from './config';

// const api_base = "http://127.0.0.1:5000";

const Screen2 = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGraph, setSelectedGraph] = useState("cprRate");

  const handleGraphChange = (event) => {
    setSelectedGraph(event.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/get-user-data/${userId}`);
        const responseData = response.data;
        if (responseData.success) {
          setUserData(responseData.data);
        } else {
          setError(responseData.message);
        }
      } catch (error) {
        setError('An error occurred while fetching user data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const feedbackTrueData = [];
  const feedbackFalseData = [];
  const feedbackTrueDataFrac = [];
  const feedbackFalseDataFrac = [];

  userData.cprDetails.forEach((detail, index) => {
    const dataPoint = { x: index, y: detail.cprRate };

    if (detail.feedback) {
      feedbackTrueData.push(dataPoint);
    } else {
      feedbackFalseData.push(dataPoint);
    }
  });

  userData.cprDetails.forEach((detail, index) => {
    const dataPoint = { x: index, y: detail.cprFraction };

    if (detail.feedback) {
      feedbackTrueDataFrac.push(dataPoint);
    } else {
      feedbackFalseDataFrac.push(dataPoint);
    }
  });

  // console.log(feedbackTrueData);
  // console.log(feedbackFalseData);

  return (
    <div>
      <h2>User Data</h2>
      {userData ? (
        <div>
          <h4>User ID: {userData.userId}</h4>
          <h5>CPR Details:</h5>
          <table>
            <thead>
              <tr>
                <th>CPR Rate</th>
                <th>CPR Fraction</th>
                <th>Compression</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {userData.cprDetails.map((detail, index) => (
                <tr key={index}>
                  <td>{detail.cprRate}</td>
                  <td>{detail.cprFraction}</td>
                  <td>{detail.compression}</td>
                  <td>{detail.feedback ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Make a dropdown to select between the 2 graphs */}
          <select value={selectedGraph} onChange={handleGraphChange}>
            <option value="cprRate">CPR Rate</option>
            <option value="cprFraction">CPR Fraction</option>
          </select>
          {selectedGraph === "cprRate" ? (
          <VictoryChart theme={VictoryTheme.material} >
            <VictoryAxis tickFormat={() => ''} label="Session" />
            <VictoryAxis
              dependentAxis
              label="CPR Rate"
              labelPlacement="vertical"
              style={{
                axisLabel: { padding: 35 }, // Adjust the padding as needed
                ticks: { stroke: 'transparent' },
                tickLabels: { fontSize: 12 },
              }}
            />
            <VictoryLine
              data={[
                { x: 0, y: 120 },
                { x: userData.cprDetails.length - 1, y: 120 },
              ]}
              style={{
                data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
              }}
            />
            <VictoryLine
              data={[
                { x: 0, y: 100 },
                { x: userData.cprDetails.length - 1, y: 100 },
              ]}
              style={{
                data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
              }}
            />
            <VictoryArea
              data={[
                { x: 0, y: 100 },
                { x: userData.cprDetails.length - 1, y: 100 },
              ]}
              y0={() => 120}
              y1={() => 120}
              style={{
                data: { fill: 'lightgreen', opacity: 0.3 },
              }}
            />
            <VictoryScatter
              data={[...feedbackTrueData]}
              style={{
                data: { fill: 'green' },
              }}
            />
            <VictoryScatter
              data={[...feedbackFalseData]}
              style={{
                data: { fill: 'red' },
              }}
            />
            <VictoryLegend
              x={50} // Adjust the x position according to your needs
              y={0} // Adjust the y position according to your needs
              orientation="vertical"
              gutter={20}
              style={{ labels: { fontSize: 12 } }}
              data={[
                { name: 'Feedback: Yes', symbol: { fill: 'green' } },
                { name: 'Feedback: No', symbol: { fill: 'red' } },
              ]}
            />
          </VictoryChart>
          ) : (
          <VictoryChart theme={VictoryTheme.material} >
            <VictoryAxis tickFormat={() => ''} label="Session" />
            <VictoryAxis
              dependentAxis
              label="CPR Fraction"
              labelPlacement="vertical"
              style={{
                axisLabel: { padding: 35 }, // Adjust the padding as needed
                ticks: { stroke: 'transparent' },
                tickLabels: { fontSize: 12 },
              }}
            />
            <VictoryLine
              data={[
                { x: 0, y: 0.82 },
                { x: userData.cprDetails.length - 1, y: 0.82 },
              ]}
              style={{
                data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
              }}
            />
            <VictoryLine
              data={[
                { x: 0, y: 0.78 },
                { x: userData.cprDetails.length - 1, y: 0.78 },
              ]}
              style={{
                data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
              }}
            />
            <VictoryArea
              data={[
                { x: 0, y: 0.78 },
                { x: userData.cprDetails.length - 1, y: 0.78 },
              ]}
              y0={() => 0.82}
              y1={() => 0.82}
              style={{
                data: { fill: 'lightgreen', opacity: 0.3 },
              }}
            />
            <VictoryScatter
              data={[...feedbackTrueDataFrac]}
              style={{
                data: { fill: 'green' },
              }}
            />
            <VictoryScatter
              data={[...feedbackFalseDataFrac]}
              style={{
                data: { fill: 'red' },
              }}
            />
            <VictoryLegend
              x={50} // Adjust the x position according to your needs
              y={0} // Adjust the y position according to your needs
              orientation="vertical"
              gutter={20}
              style={{ labels: { fontSize: 12 } }}
              data={[
                { name: 'Feedback: Yes', symbol: { fill: 'green' } },
                { name: 'Feedback: No', symbol: { fill: 'red' } },
              ]}
            />
          </VictoryChart>
          )}
          <Link to={`/`}>
            <button>Home</button>
          </Link>
        </div>
      ) : (
        <div>User data not found.</div>
      )}
    </div>
  );
};

export default Screen2;
