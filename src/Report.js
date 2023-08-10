import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { VictoryLabel, VictoryChart, VictoryContainer, VictoryScatter, VictoryAxis, VictoryTheme, VictoryLegend, VictoryLine, VictoryArea, Background } from 'victory';
import { api_base } from './config';
import { createRoot } from 'react-dom/client';
import './Report.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from "react-router-dom";
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
        let cprRate = (3 + addSet) / ((totalDuration + 500) / 60000);
        cprRates.push(cprRate);
      }

    }

    function updatePopupWindowContent() {
      const popupWindow = window.open('', 'CPR Details', 'width=400,height=300');
      if (popupWindow && !popupWindow.closed) {
        const content = `
        <div style="background-color: #ddd;">
          <h2>CPR Details</h2>
          <div id="chart-container"></div>
          <!-- Rest of the content -->
        </div>
        `;

        popupWindow.document.body.innerHTML = content;
      } else {
        popupWindow = window.open('', 'CPR Details', 'width=400,height=300');
        const content = `
        <div style="background-color: #ddd;">
          <h2>CPR Details</h2>
          <div id="chart-container"></div>
        </div>
          <!-- Rest of the content -->
        `;
        popupWindow.document.write(content);
      }

      const chartContainer = popupWindow.document.getElementById("chart-container");

      const minY = 80;
      const maxY = 140;

      createRoot(chartContainer).render(
        <div>
          <VictoryChart
            containerComponent={<VictoryContainer responsive={false} />}
            height={400}
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
        </div>
      );
    }

    calculateSetsAndCprRates();
    updatePopupWindowContent();
  };


  const handleChange = (e) => {
    setValue(parseInt(e.target.value));

  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const optimalCPR = (detail) => {
    let sets = [];

    for (let i = 0; i < detail.reps.length - 2; i++) {
      let set = detail.reps.slice(i, i + 3);

      let repTimeCount = set.filter(rep => rep.hasOwnProperty("repTime")).length;
      if (repTimeCount === 3) {
        sets.push(set.map(rep => rep.repTime));
      }
    }

    let withinRangeCount = 0;

    for (let set of sets) {
      let totalDuration = set[set.length - 1] - set[0];
      let cprRate = (3) / ((totalDuration + 500) / 60000);

      if (100 - value <= cprRate && cprRate <= 120 + value) {
        withinRangeCount++;
      }
    }

    let percentageWithinRange = (withinRangeCount / sets.length) * 100;

    return percentageWithinRange;

  };

  const calculateFrac = (detail) => {

    let repTimes = detail.reps;
    let breathingTime = 0;
    if (repTimes[repTimes.length - 1].hasOwnProperty("breathStartTime")) {
      repTimes.push({ breathEndTime: repTimes[repTimes.length - 1].breathStartTime + 5000 });
    }
    for (let i = 0; i < repTimes.length; i++) {
      let rep = repTimes[i];

      if (rep.hasOwnProperty("breathStartTime")) {
        let breathStartTime = rep.breathStartTime;
        let breathEndTime;

        for (let j = i + 1; j < repTimes.length; j++) {
          if (repTimes[j].hasOwnProperty("breathEndTime")) {
            breathEndTime = repTimes[j].breathEndTime;
            i = j; 
            break;
          }
        }


        breathingTime += breathEndTime - breathStartTime;
      }
    }
    const lastObject = repTimes[repTimes.length - 1];
    const lastValue = Object.values(lastObject)[0]; 

    let totalTime = lastValue - repTimes[0].repTime;
    let cprFraction = ((totalTime - breathingTime) / totalTime) * 100;
    cprFraction = cprFraction.toFixed(0);

    return cprFraction;
  }



  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(api_base + 'get-user-data/' + userId);
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
  const feedbackTruenewCPRavg = [];
  const feedbackFalsenewCPRavg = [];

  let i = 1;

  userData.cprDetails.slice(-50).forEach((detail, index) => {
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

  userData.cprDetails.slice(-50).forEach((detail, index) => {
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

  userData.cprDetails.slice(-50).forEach((detail, index) => {

    if (detail.compOnly === selectedValue) {

      let percentageWithinRange = optimalCPR(detail);
      const dataPoint = { x: i, y: percentageWithinRange };

      i++;

      if (detail.feedback) {
        feedbackTruenewCPRavg.push(dataPoint);
      } else {
        feedbackFalsenewCPRavg.push(dataPoint);
      }
    }
  });

  const PAGE_SIZE = 10;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const paginatedData = [...userData.cprDetails]
    .reverse()
    .filter((detail) => detail.compOnly === selectedValue)
    .slice(startIndex, endIndex);

  const getPaginatedLen = () => {
    return Math.ceil(userData.cprDetails.filter((detail) => detail.compOnly === selectedValue).length / PAGE_SIZE);
  };

  return (
    <div className="container">
      
      <GoBackButton />

      {userData ? (
        <div>
          
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

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>
                    <span className="tooltip" data-tooltip="Date of Session">Date</span>
                  </th>
                  <th>
                    <span className="tooltip" data-tooltip="Total Average CPR Rate">Avg: Rate</span>
                  </th>
                  <th>
                    <span className="tooltip" data-tooltip="Percentage of Reps from 100 to 120 per min ">Optimal Reps %</span>
                  </th>
                  <th>
                    <span className="tooltip" data-tooltip="Fraction of time given to chest compressions is to breaths">Fraction</span>
                  </th>
                  <th>
                    <span className="tooltip" data-tooltip="Feedback provided by the system">Feedback</span>
                  </th>
                  <th>
                    <span className="tooltip" data-tooltip="Chart Details for individuals reps in the session ">Chart Details</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((detail, index) => (
                  <tr key={index}>
                    <td>{new Date(detail.createdAt).toLocaleDateString("en-IE", { timeZone: "Europe/Dublin" })}</td>
                    <td className={detail.cprRate >= 100 && detail.cprRate <= 120 ? 'green' : 'red'}>{detail.cprRate.toFixed(0)}</td>
                    <td>
                      <div className="pie animate" style={{ '--p': optimalCPR(detail), '--c': 'lightgreen' }}>
                        {optimalCPR(detail).toFixed(0)}
                      </div>
                    </td>
                    <td>{(detail.cprFraction > 98) ? calculateFrac(detail) : detail.cprFraction.toFixed(0)}</td>
                    <td>{detail.feedback ? 'Yes' : 'No'}</td>
                    <td>
                      <button className='button' onClick={() => openPopupWindow(detail)}>
                        <FontAwesomeIcon icon={faChartLine} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            {Array.from({ length: getPaginatedLen() }, (_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={currentPage === index + 1 ? 'active' : ''}
              >
                {index + 1}
              </button>
            ))}
          </div>
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
                  <VictoryChart theme={VictoryTheme.material}>
                    <VictoryAxis tickFormat={() => ''} label="Session" />
                    <VictoryAxis
                      dependentAxis
                      label="CPR Rate"
                      labelPlacement="vertical"
                      style={{
                        axisLabel: { padding: 35 }, 
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
                        axisLabel: { padding: 35 }, 
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
                </div>
              );
            } else if (selectedGraph === 'newCPRavg') {
              return (
                <div className='chart-container'>
                  <VictoryChart theme={VictoryTheme.material}>
                    <VictoryAxis
                      
                      tickFormat={() => ''}
                      label="Session"
                    />
                    <VictoryAxis
                      dependentAxis
                      label="Percentage of optimal CPR"
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
                      style={{ width: '75%' }}
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
