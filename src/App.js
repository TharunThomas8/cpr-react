import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

import cv from "@techstark/opencv-js";
import "./styles.css";

const SPACING = 16;
const LEARNING_RATE = 0.005;
const weights = new Array(1000 * 1000).fill(0);
let average_left = 0;
let average_right = 0;
let num_moving = 0;
let last_frame = 0;
let num_compressions = 0;
let frame_no = 0;
let prev_movement = 0; //-1: down, 0: stationary, 1: up
let breathing_movement = 0; //not breathing
let time_since_compression = 0;
let time_since_downward = 0;
let breath_frames = 0;
let comps_while_breathing = 0;
let down_since_last_up = false;
let startTime = 0;
let endTime = 0;
let ltot = 0;

const App = () => {
  const [tot, setTot] = useState(0);
  const [startTime, setStartTime] = useState(performance.now());
  const [CPRrate, setCPRrate] = useState(0);
  const webcamRef = useRef(null);

  useEffect(() => {
    let prevMat = null;

    const drawOpticalFlow = (flow) => {

      let totalUp = 0;       //total upward movement in frame
      let totalDown = 0;     //total downward movement in frame
      let totalLeft = 0;     //total left movement in frame
      let totalRight = 0;    //total right movement in frame
      let curr_movement = 0; //0: static, 1: up, -1: down
      let moving_regions = 0;
      let non_moving = 0;

      //calculate displacement for subset of pixels
      for (let row = SPACING / 2; row < flow.rows; row += SPACING) {
        for (let column = SPACING / 2; column < flow.cols; column += SPACING) {
          const flowData = flow.data32F;
          const index = (row * flow.cols + column) * 2; // Multiply by 2 to access x and y components

          const fxy0 = flowData[index];
          const fxy1 = flowData[index + 1];

          const old_weight = weights[row * flow.cols + column];
          let new_weight;

          // console.log(fxy);

          // 0.5 is the movement threshold
          if (fxy0 > 0.5) {
            // arrowedLine(display, Point(column, row), Point(cvRound(column + fxy1 * 3), cvRound(row + fxy0 * 3)), green, 1, 8, 0, .5);
            totalDown += fxy0 * old_weight;
            new_weight = Math.max(1.0, old_weight * (1 - LEARNING_RATE) + LEARNING_RATE);
            moving_regions++;
            if (fxy1 > 0 && old_weight > 0.99) {
              totalRight += fxy1;
            }
            if (fxy1 < 0 && old_weight > 0.99) {
              totalLeft += Math.abs(fxy1);
            }
          } else if (fxy0 < -0.5) {
            // arrowedLine(display, Point(column, row), Point(cvRound(column + fxy1 * 3), cvRound(row + fxy0 * 3)), red, 1, 8, 0, .4);
            totalUp += Math.abs(fxy0) * old_weight;
            new_weight = Math.max(1.0, old_weight * (1 - LEARNING_RATE) + LEARNING_RATE);
            moving_regions++;
            if (fxy1 > 0 && old_weight > 0.9) {
              totalRight += fxy1;
            }
            if (fxy1 < 0 && old_weight > 0.9) {
              totalLeft += Math.abs(fxy1);
            }
          } else {
            non_moving++;
            new_weight = old_weight * (1 - LEARNING_RATE);
          }

          if (breathing_movement === 0) {
            weights[row * flow.cols + column] = new_weight;
          }

          const color = new_weight > 1 ? 255 : new_weight * 255;
        }
      }




      if (
        moving_regions > 16 &&
        ((totalUp > totalDown * 2 && totalUp > 20) ||
          (totalUp > 10 && totalUp > totalDown * 5))
      ) {
        curr_movement = 1; // upward movement
        time_since_downward++;
        // end of breathing
        if (breathing_movement === 1) {
          breathing_movement = 0;
          time_since_compression = 0;
          prev_movement = 1;
          // console.log("Breath end at " + frame_no);
          last_frame = -1;
          return frame_no * -1;
        } else {
          average_left = ((average_left * num_moving) + totalLeft) / (num_moving + 1);
          average_right = ((average_right * num_moving) + totalRight) / (num_moving + 1);
          num_moving++;
        }
      } else if (
        moving_regions > 16 &&
        (totalDown > totalUp * 2 && totalDown > 20) ||
        (totalDown > 10 && totalDown > totalUp * 5)
      ) {
        curr_movement = -1;
        down_since_last_up = true;
        time_since_downward = 0;
        if (
          num_compressions > 5 &&
          ((totalRight > average_right * 5 && totalRight > totalDown / 3) ||
            (totalLeft > average_left * 5 && totalLeft > totalDown / 3))
        ) {
          if (breathing_movement === 0 && last_frame !== -1) {
            if (breath_frames === 2) {
              breathing_movement = 1;
              // console.log("Breath start at " + frame_no);
              breath_frames = 0;
              time_since_compression = 0;
              return -1;
            } else breath_frames++;
          }
        } else {
          breath_frames = 0;
          // update average lateral movement
          average_left = ((average_left * num_moving) + totalLeft) / (num_moving + 1);
          average_right = ((average_right * num_moving) + totalRight) / (num_moving + 1);
          num_moving++;
        }
      } else {
        curr_movement = 0; // stationary scene
      }
      if (prev_movement !== 1 && curr_movement === 1 && time_since_compression >= 7) {
        // previous movement not upward, current movement upward
        if (breathing_movement === 1 && comps_while_breathing < 2) {
          // self-correcting compressions while breathing
          comps_while_breathing++;
          return -1;
        } else if (down_since_last_up && time_since_downward <= 10) {
          // there has been downward movement since last upward movement, there has been recent downward movement
          num_compressions++;
          prev_movement = curr_movement;
          time_since_compression = 0;
          comps_while_breathing = 0;
          breathing_movement = 0;
          breath_frames = 0;
          last_frame = frame_no;
          down_since_last_up = false;
          // console.log("Compression at " + frame_no);
          // console.log("Total Up: " + totalUp);
          // console.log("Total Down: " + totalDown);
          // console.log("Moving Regions: " + moving_regions);
          return frame_no;
        }
      }
      prev_movement = curr_movement;
      time_since_compression++;
      return -1;

    };

    const processOutputImage = (prevImage, currentImage) => {
      const prevGray = new cv.Mat();
      const currentGray = new cv.Mat();
      const prevPoints = new cv.Mat();
      const nextPoints = new cv.Mat();
      const status = new cv.Mat();
      const err = new cv.Mat();

      const flow = new cv.Mat();

      const sm1 = new cv.Mat();
      const sm2 = new cv.Mat();

      cv.resize(prevImage, sm2, new cv.Size(216, 216));
      cv.resize(currentImage, sm1, new cv.Size(216, 216));

      cv.cvtColor(sm2, prevGray, cv.COLOR_RGBA2GRAY);
      cv.cvtColor(sm1, currentGray, cv.COLOR_RGBA2GRAY);
      cv.calcOpticalFlowFarneback(
        prevGray,     // Previous grayscale image (Mat)
        currentGray,     // Current grayscale image (Mat)
        flow,      // Optical flow result (Mat)
        0.4,       // Pyramid scale factor (0.5 is a common value)
        1,         // Number of pyramid layers
        12,        // Window size
        2,         // Number of iterations at each pyramid level
        8,         // Size of the pixel neighborhood used to find polynomial expansion in each pixel
        1.2,       // Standard deviation used to smooth derivatives
        0          // Flags (set to 0)
      );



      let number = drawOpticalFlow(flow);
      if (number !== -1) {
        const endTime = performance.now();

        setTot(prevTot => prevTot + 1);
        ltot = ltot + 1;
        const cprRate = (ltot / (endTime - startTime)) * 1000;
        // console.log(cprRate);
        setCPRrate(cprRate);
        setStartTime(endTime); // Update the start time for the next calculation
      }



      prevGray.delete();
      currentGray.delete();
      prevPoints.delete();
      nextPoints.delete();
      status.delete();
      err.delete();
      flow.delete();
      sm1.delete();
      sm2.delete();
    };

    // Create the canvas and context outside the captureFrame function
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Reuse the same Image object
    const img = new Image();
    const captureFrame = () => {

      // Get front facing camera image
      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) return;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const currentMat = cv.matFromImageData(imageData);

        if (prevMat) {
          processOutputImage(prevMat, currentMat);
          prevMat.delete();
        }

        prevMat = currentMat;
      };

      img.src = imageSrc;
    };

    const interval = setInterval(captureFrame, 30); // Adjust the interval as needed
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <h2>Real-time Optical Flow</h2>
      <div className="webcamContainer">
        <h3>Live Feed</h3>
        <Webcam
          ref={webcamRef}
          className="webcam"
          mirrored
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 640, height: 480 }} // Adjust the width and height as needed
        />
      </div>
      <div className="totValue">{tot}</div>
      <div className="rateValue">{CPRrate} Compressions per s</div>
    </div>
  );
};

export default App;
