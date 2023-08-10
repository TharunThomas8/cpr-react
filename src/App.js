import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import HomePage from './HomePage.js';
import Screen1 from './Training.js';
import Screen2 from './Report.js';
import Trainer from './Trainer';
import GameScreen from './GameScreen';
import Leaderboard from './Leaderboard';
import LandingPage from './LandingPage';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/cpr/:userId" component={Screen1} />
        <Route path="/report/:userId" component={Screen2} />
        <Route path= "/trainer" component={Trainer} />
        <Route path="/game/:userId" component={GameScreen} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/landing" component={LandingPage} />
      </Switch>
    </Router>
  );
};

export default App;
