import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import { VictoryChart, VictoryContainer, VictoryScatter, VictoryAxis, VictoryTheme, VictoryLegend, VictoryLine, VictoryArea } from 'victory';
import { api_base } from './config';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import './Screen2.css';



// const api_base = "http://127.0.0.1:5000";

const Screen2 = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGraph, setSelectedGraph] = useState("cprRate");
  const [value, setValue] = useState(0);
  const [extraSet, setExtraSet] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedValue, setSelectedValue] = useState(false);

  const handleRadioChange = (value) => {
    setSelectedValue(value === 'true'); // Convert string value to boolean
  };


  const handleGraphChange = (event) => {
    setSelectedGraph(event.target.value);
  };

  const openPopupWindow = (detail) => {

    let repTimes = detail.reps;
    let addSet = 0;
    let sets = [];
    let cprRates = [];

    function setChange(e) {
      addSet = parseInt(e.target.value);
      calculateSetsAndCprRates();
      updatePopupWindowContent();
      // console.log(addSet);
    }

    function calculateSetsAndCprRates() {
      sets = [];
      cprRates = [];

      for (let i = 0; i < repTimes.length - 2 - addSet; i++) {
        let set = repTimes.slice(i, i + 3 + addSet);

        let repTimeCount = set.filter(rep => rep.hasOwnProperty("repTime")).length;
        if (repTimeCount === 3 + addSet) {
          sets.push(set.map(rep => rep.repTime));
        }
      }

      for (let set of sets) {
        let totalDuration = set[2 + addSet] - set[0];
        let cprRate = (3 + addSet) / (totalDuration / 60000);
        cprRates.push(cprRate);
      }

      // console.log(cprRates);
    }

    function updatePopupWindowContent() {
      const popupWindow = window.open('', 'CPR Details', 'width=400,height=300');
      if (popupWindow && !popupWindow.closed) {
        // If a popup window is already open, update the content
        const content = `
          <h2>CPR Details</h2>
          <div id="chart-container"></div>
          <!-- Rest of the content -->
        `;

        popupWindow.document.body.innerHTML = content;
      } else {
        // If no popup window is open, open a new one and set the content
        popupWindow = window.open('', 'CPR Details', 'width=400,height=300');
        const content = `
          <h2>CPR Details</h2>
          <div id="chart-container"></div>
          <!-- Rest of the content -->
        `;
        popupWindow.document.write(content);
      }

      // Create the VictoryChart element dynamically
      const chartContainer = popupWindow.document.getElementById("chart-container");

      // Calculate the minimum and maximum y-axis values
      const minY = Math.min(...cprRates);
      const maxY = Math.max(...cprRates);

      createRoot(chartContainer).render(
        <div>
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
              interpolation="natural"
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
          <p>Extra Set Range</p>
          <div>
            <input
              type="range"
              min={0}
              max={7}
              value={addSet}
              onChange={setChange}
              style={{ width: '200px' }}
            />
          </div>
          <p>Consecutive Set: {3 + addSet}</p>
        </div>
      );
    }

    calculateSetsAndCprRates();
    updatePopupWindowContent();
  };


  const handleChange = (e) => {

    // console.log(value);
    setValue(parseInt(e.target.value));

  };

  const handleExtraChange = (e) => {
    setExtraSet(parseInt(e.target.value));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
      let cprRate = (3) / (totalDuration / 60000);

      if (100 - value <= cprRate && cprRate <= 120 + value) {
        withinRangeCount++;
      }
    }

    let percentageWithinRange = (withinRangeCount / sets.length) * 100;

    return percentageWithinRange;
  };



  useEffect(() => {
    const fetchData = async () => {
      try {
        // console.log(userId);
        const response = await axios.get(api_base + 'get-user-data/' + userId);
        const responseData = response.data;
        if (responseData.success) {
          // console.log(responseData.data.cprDetails[105].compOnly);
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

  let i = 1;

  userData.cprDetails.forEach((detail, index) => {
    if (detail.compOnly === selectedValue) {
      const dataPoint = { x: i, y: detail.cprRate };
      i++;
      // console.log(detail.compOnly)

      if (detail.feedback) {
        feedbackTrueData.push(dataPoint);
      } else {
        feedbackFalseData.push(dataPoint);
      }
    }
  });
  i = 1;

  userData.cprDetails.forEach((detail, index) => {
    if (detail.compOnly === selectedValue) {
      const dataPoint = { x: i, y: detail.cprFraction };
      // console.log(dataPoint);
      i++;

      if (detail.feedback) {
        feedbackTrueDataFrac.push(dataPoint);
      } else {
        feedbackFalseDataFrac.push(dataPoint);
      }
    }
  });

  i = 1;

  userData.cprDetails.forEach((detail, index) => {
    if (detail.compOnly === selectedValue) {
      let sets = [];

      for (let i = 0; i < detail.reps.length - 2 - extraSet; i++) {
        let set = detail.reps.slice(i, i + 3 + extraSet);

        // Check if the set contains exactly 3 repTime values
        let repTimeCount = set.filter(rep => rep.hasOwnProperty("repTime")).length;
        if (repTimeCount === 3 + extraSet) {
          sets.push(set.map(rep => rep.repTime));
        }
      }

      let withinRangeCount = 0;

      for (let set of sets) {
        let totalDuration = set[set.length - 1] - set[0];
        let cprRate = (3 + extraSet) / (totalDuration / 60000);

        if (100 - value <= cprRate && cprRate <= 120 + value) {
          withinRangeCount++;
        }
      }

      let percentageWithinRange = (withinRangeCount / sets.length) * 100;

      const dataPoint = { x: i, y: percentageWithinRange };

      i++;

      if (detail.feedback) {
        feedbackTruenewCPRavg.push(dataPoint);
      } else {
        feedbackFalsenewCPRavg.push(dataPoint);
      }
    }
  });


  // console.log(feedbackTrueData);
  // console.log(feedbackFalsenewCPRavg);

  // Pagination logic
  const PAGE_SIZE = 20;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  // const paginatedData = userData.cprDetails.slice().reverse().slice(startIndex, endIndex);
  const paginatedData = [...userData.cprDetails]
    .reverse()
    .filter((detail) => detail.compOnly === selectedValue)
    .slice(startIndex, endIndex);

  // console.log(paginatedData);

  const pageCount = Math.ceil(paginatedData.length / PAGE_SIZE);

  return (
    <div className="container">
      <Link to={`/`}>
        <button className='button'>Home</button>
      </Link>
      <h2>User Page</h2>

      {userData ? (
        <div>
          <h4>Welcome! User {userData.userId}</h4>
          {/* <div className="radio-container" >
            <label>
              <input
                type="radio"
                value="true"
                checked={selectedValue === true}
                onChange={handleRadioChange}
              />
              Compression Only
            </label>
            <label>
              <input
                type="radio"
                value="false"
                checked={selectedValue === false}
                onChange={handleRadioChange}
              />
              Compression + Breaths
            </label>
          </div> */}
          <div className="radio-container">
            <div
              className={`radio-button ${selectedValue === true ? 'active' : ''}`}
              onClick={() => handleRadioChange('true')}
            >
              Compression Only
            </div>
            <div
              className={`radio-button ${selectedValue === false ? 'active' : ''}`}
              onClick={() => handleRadioChange('false')}
            >
              Compression + Breaths
            </div>
          </div>

          <center><h3>CPR Details</h3></center>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rate</th>
                  <th>Optimal Reps %</th>
                  <th>Fraction</th>
                  <th>Compressions</th>
                  <th>Feedback</th>
                  <th>Chart Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((detail, index) => (
                  <tr key={index}>
                    <td>{new Date(detail.createdAt).toLocaleString("en-IE", { timeZone: "Europe/Dublin" })}</td>
                    <td className={detail.cprRate >= 100 && detail.cprRate <= 120 ? 'green' : 'red'}>{detail.cprRate.toFixed(0)}</td>
                    {/* <td className={optimalCPR(detail) >= 60 ? 'green' : 'red'}>{optimalCPR(detail).toFixed(0)}</td> */}
                    <td>
                      <div className="pie animate" style={{ '--p': optimalCPR(detail), '--c': 'lightgreen' }}>
                        {optimalCPR(detail).toFixed(0)}
                      </div>
                    </td>
                    <td>{detail.cprFraction.toFixed(0)}</td>
                    <td>{detail.compression}</td>
                    <td>{detail.feedback ? 'Yes' : 'No'}</td>
                    <td>
                      <button className='button' onClick={() => openPopupWindow(detail)}>
                        Show
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="pagination">
            {Array.from({ length: Math.ceil(userData.cprDetails.length / PAGE_SIZE) }, (_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={currentPage === index + 1 ? 'active' : ''}
              >
                {index + 1}
              </button>
            ))}
          </div>
          {/* Make a dropdown to select between the 2 graphs */}
          <p>Select the graph
            <select className="select-dropdown" value={selectedGraph} onChange={handleGraphChange}>
              <option value="cprRate">Final CPR Rate</option>
              <option value="cprFraction">CPR Fraction</option>
              <option value="newCPRavg">% of optimal CPR</option>
            </select>
          </p>
          {(() => {
            if (selectedGraph === 'cprRate') {
              return (
                <div className='chart-container'>
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
                        { x: feedbackTrueData.length + feedbackFalseData.length + 1, y: 120 },
                      ]}
                      style={{
                        data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
                      }}
                    />
                    <VictoryLine
                      data={[
                        { x: 0, y: 100 },
                        { x: feedbackTrueData.length + feedbackFalseData.length + 1, y: 100 },
                      ]}
                      style={{
                        data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
                      }}
                    />
                    <VictoryArea
                      data={[
                        { x: 0, y: 100 },
                        { x: feedbackTrueData.length + feedbackFalseData.length + 1, y: 100 },
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
                </div>
              );
            } else if (selectedGraph === 'cprFraction') {
              return (
                <div className='chart-container'>
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
                        { x: feedbackTrueDataFrac.length + feedbackFalseDataFrac.length + 1, y: 80 },
                      ]}
                      style={{
                        data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
                      }}
                    />
                    <VictoryLine
                      data={[
                        { x: 0, y: 60 },
                        { x: feedbackTrueDataFrac.length + feedbackFalseDataFrac.length + 1, y: 60 },
                      ]}
                      style={{
                        data: { stroke: 'black', strokeWidth: 1, strokeDasharray: '4' },
                      }}
                    />
                    <VictoryArea
                      data={[
                        { x: 0, y: 60 },
                        { x: feedbackTrueDataFrac.length + feedbackFalseDataFrac.length + 1, y: 60 },
                      ]}
                      y0={() => 80}
                      y1={() => 80}
                      style={{
                        data: { fill: 'red', opacity: 0.3 },
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
                </div>
              );
            } else if (selectedGraph === 'newCPRavg') {
              return (
                <div className='chart-container'>
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
                  <p>Set CPR range: {100 - value} to {value + 120} </p>
                  <div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={value}
                      onChange={handleChange}
                      style={{ width: '50%' }}
                    />
                  </div>
                  {/* <p>Min: {100 - value}</p>
                  <p>Max: {value + 120}</p> */}

                  <p>Consecutive Set: {3 + extraSet}</p>
                  <div>
                    <input
                      type="range"
                      min={0}
                      max={7}
                      value={extraSet}
                      onChange={handleExtraChange}
                      style={{ width: '50%' }}
                    />
                  </div>
                </div>


              );
            }
          })()}


        </div>
      ) : (
        <div>User data not found.</div>
      )}
    </div>
  );
};

export default Screen2;
