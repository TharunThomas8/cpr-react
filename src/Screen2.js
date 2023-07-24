import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import { VictoryLabel, VictoryChart, VictoryContainer, VictoryScatter, VictoryAxis, VictoryTheme, VictoryLegend, VictoryLine, VictoryArea } from 'victory';
import { api_base } from './config';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import './Screen2.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
// import React from "react";
import { useHistory } from "react-router-dom";
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';



// const api_base = "http://127.0.0.1:5000";
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

    function setChange(e) {
      addSet = parseInt(e.target.value);
      calculateSetsAndCprRates();
      updatePopupWindowContent();
      // console.log(addSet);
    }

    function calculateSetsAndCprRates() {
      // console.log(detail)

      const createdAtDate = (new Date(detail.createdAt));
      const referenceDate = new Date('2023-07-24');

      // console.log(createdAtDate)
      // console.log(referenceDate);
      if (createdAtDate.getTime() > referenceDate.getTime()) {
        // 'createdAtDate' is after July 24, 2023

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
          let cprRate = (3 + addSet) / ((totalDuration+500) / 60000);
          cprRates.push(cprRate);
        }

        // console.log(addSet);
      }
      else {
        // 'createdAtDate' is after July 24, 2023

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

        // console.log(addSet);
      }
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
      // const minY = Math.min(...cprRates);
      // const maxY = Math.max(...cprRates);
      const minY = 40;
      const maxY = 200;

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
          {/* <p>Extra Set Range</p>
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
          <p>Consecutive Set: {3 + addSet}</p> */}
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

    // console.log(detail,createdAt);
    const createdAtDate = (new Date(detail.createdAt));
    const referenceDate = new Date('2023-07-24');

    // console.log(createdAtDate)
    // console.log(referenceDate);
    if (createdAtDate.getTime() > referenceDate.getTime()) {
      // 'createdAtDate' is after July 24, 2023
      // console.log("Date comes after July 24, 2023");
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

        if (100 - value <= cprRate && cprRate <= 120 + value) {
          withinRangeCount++;
        }
      }

      let percentageWithinRange = (withinRangeCount / sets.length) * 100;

      return percentageWithinRange;
    } else {
      // 'createdAtDate' is on or before July 24, 2023
      // console.log("Date comes on or before July 24, 2023");
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
    }


  };

  const calculateFrac = (detail) => {

    let repTimes = detail.reps;
    let breathingTime = 0;
    // let currentTime = performance.now() - startTimeRef.current;
    if (repTimes[repTimes.length - 1].hasOwnProperty("breathStartTime")) {
      repTimes.push({ breathEndTime: repTimes[repTimes.length - 1].breathStartTime + 5000 });
    }
    for (let i = 0; i < repTimes.length; i++) {
      let rep = repTimes[i];

      if (rep.hasOwnProperty("breathStartTime")) {
        let breathStartTime = rep.breathStartTime;
        let breathEndTime;

        // Find the nearest following breathEndTime
        for (let j = i + 1; j < repTimes.length; j++) {
          if (repTimes[j].hasOwnProperty("breathEndTime")) {
            breathEndTime = repTimes[j].breathEndTime;
            i = j; // Update the outer loop index
            break;
          }
        }

        // If no breathEndTime found, use current time
        // if (!breathEndTime) {
        //   // breathEndTime = breathStartTime + 5000;
        //   // console.log(breathingTime, breathEndTime, breathStartTime);
        //   breathingTime = 5000;

        // }
        // else {

        breathingTime += breathEndTime - breathStartTime;
        // console.log(breathingTime);
        // }
      }
    }

    // pause code execution for 1 second


    // console.log(repTimes[repTimes.length - 1].repTime - repTimes[0].repTime);
    const lastObject = repTimes[repTimes.length - 1]; // Get the last object
    const lastValue = Object.values(lastObject)[0]; // Get the value of the last property

    let totalTime = lastValue - repTimes[0].repTime;
    // console.log(totalTime);
    let cprFraction = ((totalTime - breathingTime) / totalTime) * 100;

    // round cprFraction to 3 decimal places using Fixed-point notation
    cprFraction = cprFraction.toFixed(0);

    // console.log(cprFraction);

    return cprFraction;
  }



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
    // console.log(new Date(detail.createdAt).toLocaleDateString("en-IE", { timeZone: "Europe/Dublin" }));

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

  let dateLabels = [];
  userData.cprDetails.forEach((detail, index) => {
    if (detail.compOnly === selectedValue) {
      dateLabels.push(new Date(detail.createdAt).toLocaleDateString("en-IE", { timeZone: "Europe/Dublin" }))
    }
  });

  // console.log(dateLabels);

  // console.log(feedbackTrueData);
  // console.log(feedbackTruenewCPRavg);

  // Pagination logic
  const PAGE_SIZE = 10;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  // const paginatedData = userData.cprDetails.slice().reverse().slice(startIndex, endIndex);
  const paginatedData = [...userData.cprDetails]
    .reverse()
    .filter((detail) => detail.compOnly === selectedValue)
    .slice(startIndex, endIndex);

  // console.log(paginatedData);

  // const pageCount = Math.ceil(paginatedData.length / PAGE_SIZE);

  const getPaginatedLen = () => {
    // console.log(userData.cprDetails.filter((detail) => detail.compOnly === selectedValue).length);
    return Math.ceil(userData.cprDetails.filter((detail) => detail.compOnly === selectedValue).length / PAGE_SIZE);
  };

  return (
    <div className="container">
      {/* <Link to={`/`}>
        <button className='button'><FontAwesomeIcon icon={faHome} /></button>
      </Link> */}
      <GoBackButton />

      {userData ? (
        <div>
          {/* <h4>Welcome! User {userData.userId}</h4> */}
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

          {/* <center><h3>CPR Details</h3></center> */}
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
                  {/* <th>
                    <span className="tooltip" data-tooltip="Total No:of Compressions">Compressions</span>
                  </th> */}
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
                    {/* <td className={optimalCPR(detail) >= 60 ? 'green' : 'red'}>{optimalCPR(detail).toFixed(0)}</td> */}
                    <td>
                      <div className="pie animate" style={{ '--p': optimalCPR(detail), '--c': 'lightgreen' }}>
                        {optimalCPR(detail).toFixed(0)}
                      </div>
                    </td>
                    <td>{(detail.cprFraction > 98) ? calculateFrac(detail) : detail.cprFraction.toFixed(0)}</td>
                    {/* <td>{detail.compression}</td> */}
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
          {/* Pagination */}
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
                  <VictoryChart theme={VictoryTheme.material}>
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
                    <VictoryAxis
                      // tickValues={dateLabels}
                      // tickFormat={(index) => dateLabels[index]}
                      tickFormat={() => ''}
                      label="Session"
                    // tickLabelComponent={
                    //   <VictoryLabel
                    //     angle={-90}
                    //     dx={-15} // Adjust this value to control the vertical spacing of the labels
                    //     // textAnchor="end" // Anchor the text at the end to make it vertically displayed
                    //     // margin = {2}
                    //   />
                    // }
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
                  {/* <p>Min: {100 - value}</p>
                  <p>Max: {value + 120}</p> */}

                  {/* <p>Consecutive Set: {3 + extraSet}</p>
                  <div>
                    <input
                      type="range"
                      min={0}
                      max={7}
                      value={extraSet}
                      onChange={handleExtraChange}
                      style={{ width: '75%' }}
                    />
                  </div> */}
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
