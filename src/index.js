import React from 'react';
import ReactDOM from 'react-dom';
import { Dapp } from './components/Dapp';

// We import bootstrap here, but you can remove if you want
import 'bootstrap/dist/css/bootstrap.css';

// react component. All of the logic is contained in it.
ReactDOM.render(
  <React.StrictMode>
    <Dapp />
  </React.StrictMode>,
  document.getElementById('root')
);
