import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import { VictoryChart, VictoryContainer, VictoryScatter, VictoryAxis, VictoryTheme, VictoryLegend, VictoryLine, VictoryArea } from 'victory';
import { api_base } from './config';
import ReactDOM from 'react-dom';


// const api_base = "http://127.0.0.1:5000";

const Screen2 = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGraph, setSelectedGraph] = useState("cprRate");
  const [value, setValue] = useState(0);

  const handleGraphChange = (event) => {
    setSelectedGraph(event.target.value);
  };

  const openPopupWindow = (detail) => {

    let repTimes = detail.reps;

    // console.log(repTimes);

    let sets = [];
    let cprRates = [];

    for (let i = 0; i < repTimes.length - 2; i++) {
      let set = repTimes.slice(i, i + 3);

      let repTimeCount = set.filter(rep => rep.hasOwnProperty("repTime")).length;
      if (repTimeCount === 3) {
        sets.push(set.map(rep => rep.repTime));
      }
    }

    for (let set of sets) {
      let totalDuration = set[2] - set[0];
      let cprRate = 3 / (totalDuration / 60000);
      cprRates.push(cprRate);
    }

    // console.log(cprRates);

    const popupWindow = window.open('', 'CPR Details', 'width=400,height=300');
    const content = `
    <h2>CPR Details</h2>
    <div id="chart-container"></div>
  `;
    popupWindow.document.write(content);

    // Create the VictoryChart element dynamically
    const chartContainer = popupWindow.document.getElementById("chart-container");
    const chart = popupWindow.document.createElement("div");
    chart.style.width = "100%";
    chart.style.height = "100%";

    // Calculate the minimum and maximum y-axis values
    const minY = Math.min(...cprRates);
    const maxY = Math.max(...cprRates);

    // Render the VictoryChart using React's ReactDOM.render
    ReactDOM.render(
      <VictoryChart
        containerComponent={<VictoryContainer responsive={false} />}
        height={200}
        domain={{ y: [minY - 10, maxY + 10] }}
      >
        <VictoryAxis
          dependentAxis
          label="CPR Rate"
          style={{ axisLabel: { padding: 35 }, ticks: { stroke: "transparent" } }}
        />
        <VictoryAxis
          tickFormat={() => ""}
          label="Time (sets)"
          fixLabelOverlap
          style={{ ticks: { stroke: "transparent" } }}
        />
        <VictoryLine
          data={cprRates.map((rate, index) => ({ x: index + 1, y: rate }))}
        />
        <VictoryLine
          data={[{ x: 0, y: 100 }, { x: cprRates.length + 1, y: 100 }]}
          style={{ data: { stroke: "black", strokeWidth: 1, strokeDasharray: "4" } }}
        />
        <VictoryLine
          data={[{ x: 0, y: 120 }, { x: cprRates.length + 1, y: 120 }]}
          style={{ data: { stroke: "black", strokeWidth: 1, strokeDasharray: "4" } }}
        />
        <VictoryArea
          data={[
            { x: 0, y: 100 },
            { x: cprRates.length, y: 100 },
          ]}
          y0={() => 120}
          y1={() => 120}
          style={{
            data: { fill: 'lightgreen', opacity: 0.3 },
          }}
        />


      </VictoryChart>

      ,
      chart
    );

    // Append the chart to the chart container in the popup window's document
    chartContainer.appendChild(chart);
  };

  const handleChange = (e) => {

    // console.log(value);
    setValue(parseInt(e.target.value));
    
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // console.log(userId);
        const response = await axios.get(api_base + 'get-user-data/' + userId);
        const responseData = response.data;
        if (responseData.success) {
          // console.log(responseData.data[0].reps);
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
  const feedbackTruenewCPRavg = [];
  const feedbackFalsenewCPRavg = [];

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
    // console.log(dataPoint);

    if (detail.feedback) {
      feedbackTrueDataFrac.push(dataPoint);
    } else {
      feedbackFalseDataFrac.push(dataPoint);
    }
  });

  userData.cprDetails.forEach((detail, index) => {
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
      let cprRate = 3 / (totalDuration / 60000);

      if (100 - value <= cprRate && cprRate <= 120 + value) {
        withinRangeCount++;
      }
    }

    let percentageWithinRange = (withinRangeCount / sets.length) * 100;

    const dataPoint = { x: index, y: percentageWithinRange };

    if (detail.feedback) {
      feedbackTruenewCPRavg.push(dataPoint);
    } else {
      feedbackFalsenewCPRavg.push(dataPoint);
    }
  });

  // console.log("AGAIN");

  // console.log(feedbackTrueData);
  // console.log(feedbackFalsenewCPRavg);

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
                <th>Chart CPR Details</th>
              </tr>
            </thead>
            <tbody>
              {userData.cprDetails.map((detail, index) => (
                <tr key={index}>
                  <td>{detail.cprRate}</td>
                  <td>{detail.cprFraction}</td>
                  <td>{detail.compression}</td>
                  <td>{detail.feedback ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => openPopupWindow(detail)}>
                      Chart CPR Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Make a dropdown to select between the 2 graphs */}
          <select value={selectedGraph} onChange={handleGraphChange}>
            <option value="cprRate">Final CPR Rate</option>
            <option value="cprFraction">CPR Fraction</option>
            <option value="newCPRavg">% of optimal CPR</option>
          </select>
          {(() => {
            if (selectedGraph === 'cprRate') {
              return (
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
              );
            } else if (selectedGraph === 'cprFraction') {
              return (
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
                      { x: 0, y: 80 },
                      { x: userData.cprDetails.length - 1, y: 80 },
                    ]}
                    style={{
                      data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
                    }}
                  />
                  <VictoryLine
                    data={[
                      { x: 0, y: 60 },
                      { x: userData.cprDetails.length - 1, y: 60 },
                    ]}
                    style={{
                      data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
                    }}
                  />
                  <VictoryArea
                    data={[
                      { x: 0, y: 60 },
                      { x: userData.cprDetails.length - 1, y: 60 },
                    ]}
                    y0={() => 80}
                    y1={() => 80}
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
              );
            } else if (selectedGraph === 'newCPRavg') {
              return (
                <div>
                  <VictoryChart theme={VictoryTheme.material}>
                    <VictoryAxis tickFormat={() => ''} label="Session" />
                    <VictoryAxis
                      dependentAxis
                      label="new CPR Avg"
                      labelPlacement="vertical"
                      style={{
                        axisLabel: { padding: 35 },
                        ticks: { stroke: 'transparent' },
                        tickLabels: { fontSize: 12 },
                      }}
                      domain={[0, feedbackFalsenewCPRavg.length > 0 ? 100 : 1]}
                    />
                    <VictoryScatter
                      data={[...feedbackTruenewCPRavg]}
                      style={{
                        data: { fill: 'green' },
                      }}
                    />
                    <VictoryScatter
                      data={[...feedbackFalsenewCPRavg]}
                      style={{
                        data: { fill: 'red' },
                      }}
                    />
                    <VictoryLegend
                      x={50}
                      y={0}
                      orientation="vertical"
                      gutter={20}
                      style={{ labels: { fontSize: 12 } }}
                      data={[
                        { name: 'Feedback: Yes', symbol: { fill: 'green' } },
                        { name: 'Feedback: No', symbol: { fill: 'red' } },
                      ]}
                    />
                  </VictoryChart>
                  <p>Set the range</p>
                  <div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={value}
                      onChange={handleChange}
                      style={{ width: '200px' }}
                    />
                  </div>
                  <p>Min: {100 - value}</p>
                  <p>Max: {value + 120}</p>
                </div>


              );
            }
          })()}

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
