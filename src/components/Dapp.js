import React from 'react';
import Web3 from 'web3';

import WETHAbi from '../contracts/WETHAbi.json';
import contractAddress from '../contracts/addresses.json';

import { NoWalletDetected } from './NoWalletDetected';
import { ConnectWallet } from './ConnectWallet';
import { TransactionErrorMessage } from './TransactionErrorMessage';
import { WaitingForTransactionMessage } from './WaitingForTransactionMessage';
import { Deposit } from './Deposit';
import { Approve } from './Approve';
import { Allowance } from './Allowance';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined,
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      network: 0,
      wethBalance: undefined,
      wethAllowance: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <p> address: {this.state.selectedAddress}</p>
            <p> network: {this.state.network} </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>
        {/* weth */}
        {contractAddress[this.state.network].weth && (
          <div className="row">
            <div className="col-12 bg-info text-white">
              <p> weth: {this.state.wethBalance} </p>
              <p> weth allowance: {this.state.wethAllowance} </p>
            </div>
            <div className="col-12">
              <Deposit deposit={(amount) => this._deposit(amount)} />
            </div>
            <div className="col-12">
              <Approve
                approve={(contractAddress, amount) =>
                  this._approve(contractAddress, amount)
                }
              />
            </div>
            <div className="col-12">
              <Allowance
                allowance={(contractAddress) =>
                  this._getWETHAllowance(contractAddress)
                }
              />
            </div>
            <hr />
          </div>
        )}
      </div>
    );
  }

  async _connectWallet() {
    await this._initialize();

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on('accountsChanged', () => {
      this._resetState();
      this._initialize();
    });
    // We reset the dapp state if the network is changed
    window.ethereum.on('networkChanged', () => {
      this._resetState();
      this._initialize();
    });
  }

  async _initialize() {
    const [selectedAddress] = await window.ethereum.enable();
    this.setState({
      selectedAddress: selectedAddress,
      network: window.ethereum.networkVersion,
    });
    this._web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545');

    // weth
    if (contractAddress[this.state.network].weth) {
      this._weth = new this._web3.eth.Contract(
        WETHAbi,
        contractAddress[this.state.network].weth
      );
      try {
        this._getWETHBalance();
      } catch (e) {
        console.log(e);
      }
    }
  }

  async _getWETHBalance() {
    const balance = await this._weth.methods
      .balanceOf(this.state.selectedAddress)
      .call();
    this.setState({ wethBalance: balance });
  }

  async _getWETHAllowance(contractAddress) {
    const allowance = await this._weth.methods
      .allowance(this.state.selectedAddress, contractAddress)
      .call();
    this.setState({ wethAllowance: allowance });
  }

  async _deposit(amount) {
    this._dismissTransactionError();

    const wei = this._web3.utils.toWei(amount.toString(), 'ether');
    await this._weth.methods
      .deposit()
      .send({ from: this.state.selectedAddress, value: wei })
      .on('transactionHash', (hash) => {
        this.setState({ txBeingSent: hash });
      })
      .on('receipt', () => {
        this.setState({ txBeingSent: undefined });
      })
      .on('error', (e) => {
        if (e.code === ERROR_CODE_TX_REJECTED_BY_USER) {
          return;
        }
        console.error(e);
        this.setState({ transactionError: e });
      });
    this.setState({ txBeingSent: undefined });
    this._getWETHBalance();
  }

  async _approve(contractAddress, amount) {
    this._dismissTransactionError();

    const wei = this._web3.utils.toWei(amount.toString(), 'ether');
    await this._weth.methods
      .approve(contractAddress, wei)
      .send({ from: this.state.selectedAddress })
      .on('transactionHash', (hash) => {
        this.setState({ txBeingSent: hash });
      })
      .on('receipt', () => {
        this.setState({ txBeingSent: undefined });
      })
      .on('error', (e) => {
        if (e.code === ERROR_CODE_TX_REJECTED_BY_USER) {
          return;
        }
        console.error(e);
        this.setState({ transactionError: e });
      });
    this.setState({ txBeingSent: undefined });
    this._getWETHAllowance(contractAddress);
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }
    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }
}
