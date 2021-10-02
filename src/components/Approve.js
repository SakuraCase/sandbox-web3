import React from 'react';

export function Approve({ approve }) {
  return (
    <div>
      <h4>Approve</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const contractAddress = formData.get('contractAddress');
          const amount = formData.get('amount');

          if (contractAddress && amount) {
            approve(contractAddress, amount);
          }
        }}
      >
        <div className="form-group">
          <label>Contract Address</label>
          <input
            className="form-control"
            type="text"
            name="contractAddress"
            placeholder="Specify your own address temporarily."
            required
          />
        </div>
        <div className="form-group">
          <label>Amount</label>
          <input
            className="form-control"
            type="number"
            step="1"
            name="amount"
            placeholder="1"
            required
          />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Approve" />
        </div>
      </form>
    </div>
  );
}
