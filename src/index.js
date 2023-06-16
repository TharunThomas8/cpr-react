import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Screen1 from './Screen1';

const App = () => {
  const [showScreen1, setShowScreen1] = React.useState(false);

  const handleButtonClick = () => {
    setShowScreen1(prevShowScreen1 => !prevShowScreen1);
  };

  return (
    <div>
      {!showScreen1 && (
        <button onClick={handleButtonClick}>Go to Screen1</button>
      )}
      {showScreen1 && (
        <div>
          <button onClick={handleButtonClick}>Go back</button>
          <Screen1 />
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
