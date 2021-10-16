import React from 'react';
import Web3 from 'web3';

import WETHAbi from '../contracts/WETHAbi.json';
import DummyERC20Abi from '../contracts/DummyERC20Abi.json';
import RootChainManagerAbi from '../contracts/RootChainManagerAbi.json';
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
      dummyERC20Balance: undefined,
      dummyERC20Allowance: undefined,
    };

    this.stateNameMap = {
      '0xc778417E063141139Fce010982780140Aa0cD5Ab': 'weth',
      '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa': 'weth',
      '0x655F2166b0709cd575202630952D71E2bB0d61Af': 'dummyERC20',
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
        <div className="row">
          <div className="col-12">
            <p> address: {this.state.selectedAddress}</p>
            <p> network: {this.state.network} </p>
          </div>
        </div>
        <hr />
        {/* weth */}
        {contractAddress[this.state.network].weth && (
          <div className="row">
            <h3>WETH</h3>
            <div className="col-12 bg-info text-white">
              <p> weth: {this.state.wethBalance} </p>
              <p> weth allowance: {this.state.wethAllowance} </p>
            </div>
            <div className="col-12">
              <h4>Deposit</h4>
              <Deposit deposit={(amount) => this._deposit(amount)} />
            </div>
            <div className="col-12">
              <h4>Approve</h4>
              <Approve
                approve={(contractAddress, amount) =>
                  this._approve(contractAddress, amount, this._weth)
                }
              />
            </div>
            <div className="col-12">
              <h4>Allowance</h4>
              <Allowance
                allowance={(contractAddress) =>
                  this._getAllowance(contractAddress, this._weth)
                }
              />
            </div>
          </div>
        )}
        {/* polygon bridge */}
        {contractAddress[this.state.network].rootChainManager &&
          contractAddress[this.state.network].dummyERC20 && (
            <div className="row">
              <h3>Polygon Bridge</h3>
              <div className="col-12 bg-info text-white">
                <p> dummyERC20: {this.state.dummyERC20Balance} </p>
                <p> dummyERC20 allowance: {this.state.dummyERC20Allowance} </p>
              </div>
              <div className="col-12">
                <h4>DummyERC20 Approve</h4>
                <Approve
                  approve={(contractAddress, amount) =>
                    this._approve(contractAddress, amount, this._dummyERC20)
                  }
                  contract={contractAddress[this.state.network].erc20Predicate}
                />
              </div>
              <div className="col-12">
                <h4>DummyERC20 Bridge</h4>
                <Deposit
                  deposit={(amount) => this._bridgeDummyERC20(amount, 18)}
                />
              </div>
              <div className="col-12">
                <h4>ETH → Polygon WETH</h4>
                <Deposit deposit={(amount) => this._bridgeEth(amount)} />
              </div>
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
      this._getBalance(this._weth);
    }

    if (
      contractAddress[this.state.network].rootChainManager &&
      contractAddress[this.state.network].dummyERC20
    ) {
      this._rootChainManager = new this._web3.eth.Contract(
        RootChainManagerAbi,
        contractAddress[this.state.network].rootChainManager
      );
      this._dummyERC20 = new this._web3.eth.Contract(
        DummyERC20Abi,
        contractAddress[this.state.network].dummyERC20
      );
      this._getBalance(this._dummyERC20);
      this._getAllowance(
        contractAddress[this.state.network].erc20Predicate,
        this._dummyERC20
      );
    }
  }

  async _getBalance(web3) {
    const balance = await web3.methods
      .balanceOf(this.state.selectedAddress)
      .call();
    const name = this.stateNameMap[web3.options.address] + 'Balance';
    this.setState({ [name]: balance });
  }

  async _getAllowance(contractAddress, web3) {
    const allowance = await web3.methods
      .allowance(this.state.selectedAddress, contractAddress)
      .call();
    const name = this.stateNameMap[web3.options.address] + 'Allowance';
    this.setState({ [name]: allowance });
  }

  async _deposit(amount) {
    this._dismissTransactionError();

    const wei = this._web3.utils.toWei(amount.toString(), 'ether');
    await this._weth.methods
      .deposit()
      .send({ from: this.state.selectedAddress, value: wei })
      .on('transactionHash', this._onTransactionHash.bind(this))
      .on('receipt', this._onReceipt.bind(this))
      .on('error', this._onError.bind(this));
    this.setState({ txBeingSent: undefined });
    this._getBalance(this._weth);
  }

  async _bridgeDummyERC20(amount, decimal) {
    this._dismissTransactionError();
    const depositData = this._web3.eth.abi.encodeParameter(
      'uint256',
      this._web3.utils.toBN(amount * 10 ** decimal)
    );
    await this._rootChainManager.methods
      .depositFor(
        this.state.selectedAddress,
        contractAddress[this.state.network].dummyERC20,
        depositData
      )
      .send({ from: this.state.selectedAddress });
    this.setState({ txBeingSent: undefined });
  }

  async _bridgeEth(amount) {
    this._dismissTransactionError();
    const wei = this._web3.utils.toWei(amount.toString(), 'ether');
    await this._rootChainManager.methods
      .depositEtherFor(this.state.selectedAddress)
      .send({ from: this.state.selectedAddress, value: wei })
      .on('transactionHash', this._onTransactionHash.bind(this))
      .on('receipt', this._onReceipt.bind(this))
      .on('error', this._onError.bind(this));
    this.setState({ txBeingSent: undefined });
  }

  async _approve(contractAddress, amount, web3) {
    this._dismissTransactionError();

    const wei = this._web3.utils.toWei(amount.toString(), 'ether');
    await web3.methods
      .approve(contractAddress, wei)
      .send({ from: this.state.selectedAddress })
      .on('transactionHash', this._onTransactionHash.bind(this))
      .on('receipt', this._onReceipt.bind(this))
      .on('error', this._onError.bind(this));
    this.setState({ txBeingSent: undefined });
    this._getAllowance(contractAddress, web3);
  }

  _onTransactionHash(hash) {
    this.setState({ txBeingSent: hash });
  }
  _onReceipt() {
    this.setState({ txBeingSent: undefined });
  }
  _onError(e) {
    if (e.code === ERROR_CODE_TX_REJECTED_BY_USER) {
      return;
    }
    console.error(e);
    this.setState({ transactionError: e });
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
