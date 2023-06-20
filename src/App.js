import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import HomePage from './HomePage';
import Screen1 from './Screen1';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/cpr" component={Screen1} />
      </Switch>
    </Router>
  );
};

export default App;
