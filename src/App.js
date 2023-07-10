import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import HomePage from './HomePage';
import Screen1 from './Screen1';
import Screen2 from './Screen2';
import Trainer from './Trainer';
import GameScreen from './GameScreen';
import Leaderboard from './Leaderboard';

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
      </Switch>
    </Router>
  );
};

export default App;
